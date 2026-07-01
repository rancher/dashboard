/**
 * Vite plugin that translates the webpack-specific constructs used across the
 * dashboard codebase into their Vite equivalents at transform time, so the same
 * source keeps working under both bundlers:
 *
 * - require.context(dir, recursive, regExp)      -> import.meta.glob (eager) + runtime shim
 * - require(`...${ expr }...`)                    -> import.meta.glob (eager) + runtime lookup
 * - import(`...${ expr }...`)                     -> import.meta.glob (lazy) + runtime lookup
 * - require('specifier')                          -> hoisted static import
 * - module.hot                                    -> disabled (Vite has its own HMR)
 *
 * The runtime side of these shims lives in shell/vite/webpack-compat-runtime.js.
 */
import path from 'path';
import type { Plugin } from 'vite';

const HELPER_ID = '@shell/vite/webpack-compat-runtime';
const HELPER_NAME = '__wpCompat';

const GLOB_EXCLUDES = [
  '!**/__tests__/**',
  '!**/__mocks__/**',
  '!**/*.test.*',
  '!**/*.spec.*',
  '!**/*.d.ts',
];

const CODE_EXTS = ['vue', 'js', 'ts', 'yaml', 'json'];
const ASSET_EXTS = ['svg', 'png', 'jpg', 'jpeg', 'gif', 'ico', 'webp'];
const KNOWN_EXTS = ['vue', 'js', 'ts', 'yaml', 'yml', 'json', 'md', 'csv', ...ASSET_EXTS];

const RE_REQUIRE_CONTEXT = /require\s*\.\s*context\(\s*['"]([^'"]+)['"]\s*,\s*(true|false)\s*,\s*(\/(?:[^/\\\n]|\\.)+\/[a-zA-Z]*)\s*\)/g;
const RE_REQUIRE_TEMPLATE = /(?<![.\w$])require\(\s*`([^`$]*?)\$\{([^}]+)\}([^`]*?)`\s*\)/g;
const RE_IMPORT_TEMPLATE = /(?<![.\w$])import\(\s*(?:\/\*[^*]*\*\/\s*)?`([^`$]*?)\$\{([^}]+)\}([^`]*?)`\s*\)/g;
const RE_REQUIRE_STATIC = /(?<![.\w$])require\(\s*(['"])([^'"\n]+)\1\s*\)/g;
const RE_REQUIRE_STATIC_TPL = /(?<![.\w$])require\(\s*`([^`$\n]+)`\s*\)/g;
const RE_MODULE_HOT = /\bmodule\.hot\b/g;

function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

interface WebpackCompatOptions {
  dir: string;
  shellAbs: string;
}

/**
 * Resolve a directory/module specifier as it appears in source to an absolute path.
 * Returns null when the specifier cannot be mapped (in which case the code is left untouched).
 */
function resolveSpec(spec: string, importerFile: string, { dir, shellAbs }: WebpackCompatOptions): string | null {
  if (spec.startsWith('@shell/') || spec.startsWith('~shell/')) {
    return path.join(shellAbs, spec.substr(7));
  }

  if (spec.startsWith('@pkg/')) {
    return path.join(dir, 'pkg', spec.substr(5));
  }

  if (spec.startsWith('~/') || spec.startsWith('@/')) {
    return path.join(dir, spec.substr(2));
  }

  if (spec.startsWith('./') || spec.startsWith('../')) {
    return path.resolve(path.dirname(importerFile), spec);
  }

  return null;
}

/**
 * Convert an absolute path to a Vite root-relative path ('/shell/...'), or null if outside the root.
 */
function toRootRelative(abs: string, dir: string): string | null {
  const relative = toPosix(path.relative(dir, abs));

  if (relative.startsWith('..')) {
    return null;
  }

  return `/${ relative }`;
}

/**
 * Derive the list of file extensions a require.context regex is interested in,
 * so the generated glob doesn't eagerly import unrelated files (e.g. scss).
 */
function extsFromRegExp(source: string): string[] {
  const found = KNOWN_EXTS.filter((ext) => source.includes(ext));

  if (source.includes('jpe?g')) {
    found.push('jpg', 'jpeg');
  }

  return [...new Set(found)];
}

function globFor(dirRel: string, recursive: boolean, exts: string[]): string {
  const star = recursive ? '**/*' : '*';
  const suffix = exts.length === 1 ? `.${ exts[0] }` : (exts.length ? `.{${ exts.join(',') }}` : '');

  return `${ dirRel }/${ star }${ suffix }`;
}

function globArg(pattern: string): string {
  return JSON.stringify([pattern, ...GLOB_EXCLUDES]);
}

export default function webpackCompatPlugin(options: WebpackCompatOptions): Plugin {
  const { dir } = options;

  const shouldTransform = (id: string): boolean => {
    const [file] = id.split('?');

    if (id.startsWith('\0') || id.includes('/node_modules/')) {
      return false;
    }

    // Vite-specific sources are already written against the Vite APIs
    if (file.includes('/shell/vite/') || file.endsWith('.vite.js')) {
      return false;
    }

    return file.startsWith(dir) && /\.(m?js|ts|vue)$/.test(file);
  };

  return {
    name: 'rancher:webpack-compat',

    async transform(code: string, id: string) {
      if (!shouldTransform(id) || !(code.includes('require') || code.includes('module.hot') || code.includes('import(`'))) {
        return null;
      }

      const [importerFile] = id.split('?');
      let usesHelper = false;
      let transformed = code;

      // module.hot -> disabled under Vite
      transformed = transformed.replace(RE_MODULE_HOT, '(false)');

      // require.context(dir, recursive, regExp)
      transformed = transformed.replace(RE_REQUIRE_CONTEXT, (match, spec, recursive, regExp) => {
        const abs = resolveSpec(spec, importerFile, options);
        const dirRel = abs ? toRootRelative(abs, dir) : null;

        if (!dirRel) {
          return match;
        }

        const exts = extsFromRegExp(regExp);
        const assetOnly = exts.length > 0 && exts.every((ext) => ASSET_EXTS.includes(ext));
        const globOptions = assetOnly ? `{ eager: true, query: '?url', import: 'default' }` : '{ eager: true }';
        const glob = globFor(dirRel, recursive === 'true', exts);

        usesHelper = true;

        return `${ HELPER_NAME }.createRequireContext(import.meta.glob(${ globArg(glob) }, ${ globOptions }), '${ dirRel }/', ${ regExp })`;
      });

      // require(`<dir>/${ expr }<suffix>`) - synchronous dynamic require
      transformed = transformed.replace(RE_REQUIRE_TEMPLATE, (match, prefix, expr, suffix) => {
        const abs = resolveSpec(prefix, importerFile, options);
        const dirRel = abs && prefix.endsWith('/') ? toRootRelative(path.join(abs, '.'), dir) : null;

        if (!dirRel) {
          return match;
        }

        const glob = globFor(dirRel, true, CODE_EXTS);

        usesHelper = true;

        return `${ HELPER_NAME }.dynamicRequire(import.meta.glob(${ globArg(glob) }, { eager: true }), '${ dirRel }/', (${ expr.trim() }), '${ suffix }')`;
      });

      // import(`<dir>/${ expr }<suffix>`) - asynchronous dynamic import
      transformed = transformed.replace(RE_IMPORT_TEMPLATE, (match, prefix, expr, suffix) => {
        const abs = resolveSpec(prefix, importerFile, options);
        const dirRel = abs && prefix.endsWith('/') ? toRootRelative(path.join(abs, '.'), dir) : null;

        if (!dirRel) {
          return match;
        }

        const glob = globFor(dirRel, true, CODE_EXTS);

        usesHelper = true;

        return `${ HELPER_NAME }.dynamicImport(import.meta.glob(${ globArg(glob) }), '${ dirRel }/', (${ expr.trim() }), '${ suffix }')`;
      });

      // require('specifier') - hoist to a static import
      const hoisted: string[] = [];
      const hoistedBySpec: Record<string, string> = {};

      const staticRequire = async(match: string, spec: string): Promise<string> => {
        if (spec in hoistedBySpec) {
          return hoistedBySpec[spec];
        }

        const resolved = await this.resolve(spec, importerFile);

        if (!resolved || resolved.external) {
          return match;
        }

        const local = `__wpRequire${ hoisted.length }`;
        const ext = spec.split('.').pop().toLowerCase();
        const isDefault = ext === 'json' || ASSET_EXTS.includes(ext);

        hoisted.push(isDefault ? `import ${ local } from '${ spec }';` : `import * as ${ local } from '${ spec }';`);
        hoistedBySpec[spec] = local;

        return local;
      };

      for (const re of [RE_REQUIRE_STATIC, RE_REQUIRE_STATIC_TPL]) {
        const replacements: { match: string; replacement: string }[] = [];

        for (const match of transformed.matchAll(re)) {
          const spec = re === RE_REQUIRE_STATIC ? match[2] : match[1];

          replacements.push({ match: match[0], replacement: await staticRequire(match[0], spec) });
        }

        for (const { match, replacement } of replacements) {
          transformed = transformed.split(match).join(replacement);
        }
      }

      if (hoisted.length) {
        transformed = `${ hoisted.join('\n') }\n${ transformed }`;
      }

      if (usesHelper) {
        transformed = `import * as ${ HELPER_NAME } from '${ HELPER_ID }';\n${ transformed }`;
      }

      if (transformed === code) {
        return null;
      }

      return { code: transformed, map: null };
    },
  };
}
