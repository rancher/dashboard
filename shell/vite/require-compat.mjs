import fs from 'node:fs';
import path from 'node:path';
import {
  MAY_BE_COMMONJS, REQUIRE_FILE, isCommonJS, withoutEmptyExports, wrapCommonJS
} from './commonjs.mjs';

const REQUIRE = /(?<![\w$.])require\(\s*(?:'([^'\n]+)'|"([^"\n]+)"|`([^`$\n]+)`)\s*\)/g;
const TEMPLATE_REQUIRE = /(?<![\w$.])require\(\s*`([^`\n]*\$\{[^`\n]*)`\s*\)/g;
const EXPRESSION = /\$\{[^}]*\}/g;
const REQUIRED_AS_VALUE = /\.(svg|png|jpe?g|gif|webp|ico|avif|woff2?|ttf|eot|json|ya?ml|csv|md)$/;
const MODULE_EXTENSIONS = ['js', 'jsx', 'ts', 'tsx', 'mjs', 'vue', 'json'];
const NOT_MODULE = /(^|\/)__tests__\/|\.(test|spec)\.\w+$|\.d\.ts$/;
const NOT_MODULES = ['!**/__tests__/**', '!**/*.{test,spec}.*', '!**/*.d.ts'];
const SUFFIXES = ['', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.vue', '.json', '/index.js', '/index.ts', '/index.vue'];
const CODE_FILE = /\.(js|ts|vue)$/;
const SCRIPT_FILE = /\.(js|ts)$/;
const CLASSIC_WORKER = /[?&]type=classic\b/;

const cleanId = (id) => id.split('?')[0];

const LOOKUP = `function __rancher_require_context__(modules, dir, key, request) {
  var suffixes = ${ JSON.stringify(SUFFIXES) };

  for (var i = 0; request.startsWith(dir) && i < suffixes.length; i++) {
    var file = key + request.slice(dir.length) + suffixes[i];

    if (modules[file]) {
      var module = modules[file]();

      return ${ REQUIRED_AS_VALUE }.test(file) ? __rancher_require_value__(module) : module;
    }
  }

  var error = new Error("Cannot find module '" + request + "'");

  error.code = 'MODULE_NOT_FOUND';
  throw error;
}`;

const VALUE = `function __rancher_require_value__(module) {
  return module && (module.__esModule || module[Symbol.toStringTag] === 'Module') && 'default' in module ? module.default : module;
}`;

const REQUIRE_PACKAGE = `function __rancher_require_package__(namespace) {
  var interop = namespace && !namespace.__esModule && 'default' in namespace && namespace[Symbol.toStringTag] !== 'Module';
  var onlyDefault = namespace && namespace[Symbol.toStringTag] === 'Module' && Object.keys(namespace).length === 1 && 'default' in namespace;

  return interop || onlyDefault ? namespace.default : namespace;
}`;

function parseCode(context, code) {
  try {
    return context.parse(code);
  } catch {
    return undefined;
  }
}

function applyAlias(aliases, source) {
  const alias = aliases.find(({ find }) => (typeof find === 'string' ? source === find || source.startsWith(`${ find }/`) : find.test(source)));

  return alias ? source.replace(alias.find, alias.replacement) : source;
}

/**
 * Let UI packages keep loading modules with `require('<path>')`, and keep their CommonJS files working, which webpack
 * supported and native ES modules do not. A build leaves the call to the bundler, which loads the module when the call runs and gives the module for code
 * (`module.exports` for CommonJS) and the file's value for assets, json and yaml, as webpack did. A path built from a
 * template, such as ``require(`@shell/models/${ type }`)``, can load any file the template could match in the folder
 * its fixed part names, as webpack's require contexts did, and one that starts with an expression is left as it is
 * with a warning.
 *
 * The dev server serves native ES modules, which cannot load a module when a call runs, so there each required module
 * is imported, and loads, with the file that requires it, and a CommonJS `.js` or `.ts` file becomes an ES module that
 * runs its code in a function of `(module, exports)`, as `wrapCommonJS` describes. Only code in the app's pkg folder
 * is changed.
 *
 * @param {{ root: string }} options the app's root directory
 */
export function rancherRequireCompat({ root }) {
  const pkgFolder = `${ path.join(root, 'pkg') }${ path.sep }`;
  let config = { root, command: 'serve', resolve: { alias: [] } };

  const keyFor = (dir) => {
    if (dir.startsWith('./') || dir.startsWith('../')) {
      return dir;
    }

    const target = applyAlias(config.resolve.alias || [], dir);

    if (target === dir) {
      return dir.startsWith('/') ? dir : undefined;
    }

    return path.isAbsolute(target) ? `${ path.posix.join('/', path.relative(config.root, target).split(path.sep).join('/')) }/` : undefined;
  };

  const folderFor = (dir, importer) => {
    if (dir.startsWith('./') || dir.startsWith('../')) {
      return path.resolve(path.dirname(importer), dir);
    }

    const target = applyAlias(config.resolve.alias || [], dir);

    if (target === dir) {
      return dir.startsWith('/') ? path.join(config.root, dir) : undefined;
    }

    return path.isAbsolute(target) ? target : undefined;
  };

  const isPackage = (source) => !/^[./~]/.test(source) && !source.startsWith('@pkg') && applyAlias(config.resolve.alias || [], source) === source;

  return {
    name: 'rancher:require-compat',

    configResolved(resolved) {
      config = resolved;
    },

    transform(code, id) {
      const file = cleanId(id);

      if (!file.startsWith(pkgFolder) || file.includes(`${ path.sep }node_modules${ path.sep }`) || !CODE_FILE.test(file)) {
        return;
      }

      const build = config.command === 'build';
      const program = !build && SCRIPT_FILE.test(file) && !CLASSIC_WORKER.test(id) && MAY_BE_COMMONJS.test(code) ? parseCode(this, code) : undefined;
      const commonJS = program !== undefined && isCommonJS(program);

      if (!commonJS && !code.includes('require(')) {
        return;
      }

      const imports = new Map();
      const contexts = [];
      const helpers = new Set();
      const out = (commonJS ? withoutEmptyExports(code, program) : code)
        .replace(REQUIRE, (call, single, double, template) => {
          const source = single || double || template;
          const asValue = REQUIRED_AS_VALUE.test(cleanId(source));

          if (build) {
            if (asValue) {
              helpers.add(VALUE);
            }

            return asValue ? `__rancher_require_value__(${ call })` : call;
          }

          if (!imports.has(source)) {
            imports.set(source, `__rancher_require_${ imports.size }__`);
          }

          if (asValue) {
            return imports.get(source);
          }

          if (!isPackage(source)) {
            helpers.add(REQUIRE_FILE);

            return `__rancher_require_file__(${ imports.get(source) })`;
          }

          helpers.add(REQUIRE_PACKAGE);

          return `__rancher_require_package__(${ imports.get(source) })`;
        })
        .replace(TEMPLATE_REQUIRE, (call, template) => {
          const [first, ...rest] = template.split(EXPRESSION);
          const dir = first.slice(0, first.lastIndexOf('/') + 1);
          const folder = dir && folderFor(dir, file);
          const key = dir && (build ? dir : keyFor(dir));

          if (!folder || !key) {
            this.warn(`${ file }: require(\`${ template }\`) cannot be bundled, so it will throw when it runs: start its path with a folder`);

            return call;
          }

          const last = rest[rest.length - 1];
          const extension = /^[^/]*\.\w+$/.test(last) ? last : undefined;
          const name = `__rancher_require_context_${ contexts.length }__`;

          helpers.add(LOOKUP);
          helpers.add(VALUE);

          if (build) {
            const files = fs.existsSync(folder) ? fs.readdirSync(folder, { recursive: true }).map((entry) => entry.split(path.sep).join('/')) : [];
            const required = files.filter((entry) => !NOT_MODULE.test(entry) && (extension ? entry.endsWith(extension) : MODULE_EXTENSIONS.includes(path.extname(entry).slice(1))));

            contexts.push(`function ${ name }() {\n  return {\n${ required.map((entry) => `    ${ JSON.stringify(`${ dir }${ entry }`) }: function() { return require(${ JSON.stringify(`${ dir }${ entry }`) }); },\n`).join('') }  };\n}`);
          } else {
            const files = extension ? `**/*${ extension }` : `**/*.{${ MODULE_EXTENSIONS.join(',') }}`;

            helpers.add(REQUIRE_FILE);
            contexts.push(`function ${ name }() {\n  var modules = import.meta.glob(${ JSON.stringify([`${ dir }${ files }`, ...NOT_MODULES]) }, { eager: true });\n\n  return Object.keys(modules).reduce(function(out, file) {\n    out[file] = function() { return __rancher_require_file__(modules[file]); };\n\n    return out;\n  }, {});\n}`);
          }

          return `__rancher_require_context__(${ name }(), ${ JSON.stringify(dir) }, ${ JSON.stringify(key) }, \`${ template }\`)`;
        });

      const transformed = commonJS ? wrapCommonJS(out, program) : out;

      if (transformed === code) {
        return;
      }

      const declarations = [...imports].map(([source, name]) => (REQUIRED_AS_VALUE.test(cleanId(source)) ? `import ${ name } from ${ JSON.stringify(source) };` : `import * as ${ name } from ${ JSON.stringify(source) };`));

      return { code: `${ transformed }\n${ [...declarations, ...contexts, ...helpers].join('\n') }\n`, map: null };
    },
  };
}
