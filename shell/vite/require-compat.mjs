import path from 'node:path';

const REQUIRE = /(?<![\w$.])require\(\s*(?:'([^'\n]+)'|"([^"\n]+)"|`([^`$\n]+)`)\s*\)/g;
const TEMPLATE_REQUIRE = /(?<![\w$.])require\(\s*`([^`\n]*\$\{[^`\n]*)`\s*\)/g;
const EXPRESSION = /\$\{[^}]*\}/g;
const REQUIRED_AS_VALUE = /\.(svg|png|jpe?g|gif|webp|ico|avif|woff2?|ttf|eot|json|ya?ml|csv|md)$/;
const MODULE_FILES = '{js,jsx,ts,tsx,mjs,vue,json}';
const NOT_MODULES = ['!**/__tests__/**', '!**/*.{test,spec}.*', '!**/*.d.ts'];
const SUFFIXES = ['', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.vue', '.json', '/index.js', '/index.ts', '/index.vue'];

const cleanId = (id) => id.split('?')[0];

const LOOKUP = `function __rancher_require_context__(modules, dir, key, request) {
  var suffixes = ${ JSON.stringify(SUFFIXES) };

  for (var i = 0; request.startsWith(dir) && i < suffixes.length; i++) {
    var file = key + request.slice(dir.length) + suffixes[i];

    if (modules[file]) {
      return ${ REQUIRED_AS_VALUE }.test(file) ? modules[file].default : modules[file];
    }
  }

  var error = new Error("Cannot find module '" + request + "'");

  error.code = 'MODULE_NOT_FOUND';
  throw error;
}`;

function applyAlias(aliases, source) {
  const alias = aliases.find(({ find }) => (typeof find === 'string' ? source === find || source.startsWith(`${ find }/`) : find.test(source)));

  return alias ? source.replace(alias.find, alias.replacement) : source;
}

/**
 * Let UI packages keep loading modules with `require('<path>')`, which webpack supported and native ES modules do
 * not: each call becomes an import, giving the file's value for assets, json and yaml, and the module for everything
 * else, as webpack did. A path built from a template, such as ``require(`@shell/models/${ type }`)``, loads from
 * every file the template could match in the folder its fixed part names, as webpack's require contexts did, and one
 * that starts with an expression is left as it is with a warning. Only code in the app's pkg folder is changed.
 *
 * @param {{ root: string }} options the app's root directory
 */
export function rancherRequireCompat({ root }) {
  const pkgFolder = `${ path.join(root, 'pkg') }${ path.sep }`;
  let config = { root, resolve: { alias: [] } };

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

  return {
    name: 'rancher:require-compat',

    configResolved(resolved) {
      config = resolved;
    },

    transform(code, id) {
      const file = cleanId(id);

      if (!file.startsWith(pkgFolder) || file.includes(`${ path.sep }node_modules${ path.sep }`) || !/\.(js|ts|vue)$/.test(file) || !code.includes('require(')) {
        return;
      }

      const imports = new Map();
      const contexts = [];
      const out = code
        .replace(REQUIRE, (call, single, double, template) => {
          const source = single || double || template;

          if (!imports.has(source)) {
            imports.set(source, `__rancher_require_${ imports.size }__`);
          }

          return imports.get(source);
        })
        .replace(TEMPLATE_REQUIRE, (call, template) => {
          const [first, ...rest] = template.split(EXPRESSION);
          const dir = first.slice(0, first.lastIndexOf('/') + 1);
          const key = dir && keyFor(dir);

          if (!key) {
            this.warn(`${ file }: require(\`${ template }\`) cannot be bundled, so it will throw when it runs: start its path with a folder`);

            return call;
          }

          const last = rest[rest.length - 1];
          const files = /^[^/]*\.\w+$/.test(last) ? `**/*${ last }` : `**/*.${ MODULE_FILES }`;
          const name = `__rancher_require_context_${ contexts.length }__`;

          contexts.push(`function ${ name }() {\n  return import.meta.glob(${ JSON.stringify([`${ dir }${ files }`, ...NOT_MODULES]) }, { eager: true });\n}`);

          return `__rancher_require_context__(${ name }(), ${ JSON.stringify(dir) }, ${ JSON.stringify(key) }, \`${ template }\`)`;
        });

      if (!imports.size && !contexts.length) {
        return;
      }

      const declarations = [...imports].map(([source, name]) => (REQUIRED_AS_VALUE.test(cleanId(source)) ? `import ${ name } from ${ JSON.stringify(source) };` : `import * as ${ name } from ${ JSON.stringify(source) };`));
      const lookups = contexts.length ? [LOOKUP, ...contexts] : [];

      return { code: `${ out }\n${ [...declarations, ...lookups].join('\n') }\n`, map: null };
    },
  };
}
