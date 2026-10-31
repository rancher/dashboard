import fs from 'node:fs';
import path from 'node:path';

const REQUIRE = /(?<![\w$.])require\(\s*(?:'([^'\n]+)'|"([^"\n]+)"|`([^`$\n]+)`)\s*\)/g;
const TEMPLATE_REQUIRE = /(?<![\w$.])require\(\s*`([^`\n]*\$\{[^`\n]*)`\s*\)/g;
const EXPRESSION = /\$\{[^}]*\}/g;
const REQUIRED_AS_VALUE = /\.(svg|png|jpe?g|gif|webp|ico|avif|woff2?|ttf|eot|json|ya?ml|csv|md)$/;
const MODULE_EXTENSIONS = ['js', 'jsx', 'ts', 'tsx', 'mjs', 'vue', 'json'];
const NOT_MODULE = /(^|\/)__tests__\/|\.(test|spec)\.\w+$|\.d\.ts$/;
const NOT_MODULES = ['!**/__tests__/**', '!**/*.{test,spec}.*', '!**/*.d.ts'];
const SUFFIXES = ['', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.vue', '.json', '/index.js', '/index.ts', '/index.vue'];

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

const UNWRAP = `function __rancher_require_module__(module) {
  return module && !module.__esModule && Object.keys(module).length === 1 && 'default' in module ? module.default : module;
}`;

function applyAlias(aliases, source) {
  const alias = aliases.find(({ find }) => (typeof find === 'string' ? source === find || source.startsWith(`${ find }/`) : find.test(source)));

  return alias ? source.replace(alias.find, alias.replacement) : source;
}

/**
 * Let UI packages keep loading modules with `require('<path>')`, which webpack supported and native ES modules do
 * not. A build leaves the call to the bundler, which loads the module when the call runs and gives the module for code
 * (`module.exports` for CommonJS) and the file's value for assets, json and yaml, as webpack did. A path built from a
 * template, such as ``require(`@shell/models/${ type }`)``, can load any file the template could match in the folder
 * its fixed part names, as webpack's require contexts did, and one that starts with an expression is left as it is
 * with a warning.
 *
 * The dev server serves native ES modules, which cannot load a module when a call runs, so there each required module
 * is imported, and loads, with the file that requires it. Only code in the app's pkg folder is changed.
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

      if (!file.startsWith(pkgFolder) || file.includes(`${ path.sep }node_modules${ path.sep }`) || !/\.(js|ts|vue)$/.test(file) || !code.includes('require(')) {
        return;
      }

      const build = config.command === 'build';
      const imports = new Map();
      const contexts = [];
      let unwrap = false;
      let value = false;
      const out = code
        .replace(REQUIRE, (call, single, double, template) => {
          const source = single || double || template;
          const asValue = REQUIRED_AS_VALUE.test(cleanId(source));

          if (build) {
            value = value || asValue;

            return asValue ? `__rancher_require_value__(${ call })` : call;
          }

          if (!imports.has(source)) {
            imports.set(source, `__rancher_require_${ imports.size }__`);
          }

          if (asValue || !isPackage(source)) {
            return imports.get(source);
          }

          unwrap = true;

          return `__rancher_require_module__(${ imports.get(source) })`;
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

          if (build) {
            const files = fs.existsSync(folder) ? fs.readdirSync(folder, { recursive: true }).map((entry) => entry.split(path.sep).join('/')) : [];
            const required = files.filter((entry) => !NOT_MODULE.test(entry) && (extension ? entry.endsWith(extension) : MODULE_EXTENSIONS.includes(path.extname(entry).slice(1))));

            contexts.push(`function ${ name }() {\n  return {\n${ required.map((entry) => `    ${ JSON.stringify(`${ dir }${ entry }`) }: function() { return require(${ JSON.stringify(`${ dir }${ entry }`) }); },\n`).join('') }  };\n}`);
          } else {
            const files = extension ? `**/*${ extension }` : `**/*.{${ MODULE_EXTENSIONS.join(',') }}`;

            contexts.push(`function ${ name }() {\n  var modules = import.meta.glob(${ JSON.stringify([`${ dir }${ files }`, ...NOT_MODULES]) }, { eager: true });\n\n  return Object.keys(modules).reduce(function(out, file) {\n    out[file] = function() { return modules[file]; };\n\n    return out;\n  }, {});\n}`);
          }

          return `__rancher_require_context__(${ name }(), ${ JSON.stringify(dir) }, ${ JSON.stringify(key) }, \`${ template }\`)`;
        });

      if (out === code) {
        return;
      }

      const declarations = [...imports].map(([source, name]) => (REQUIRED_AS_VALUE.test(cleanId(source)) ? `import ${ name } from ${ JSON.stringify(source) };` : `import * as ${ name } from ${ JSON.stringify(source) };`));
      const lookups = [...(contexts.length ? [LOOKUP, ...contexts] : []), ...(contexts.length || value ? [VALUE] : []), ...(unwrap ? [UNWRAP] : [])];

      return { code: `${ out }\n${ [...declarations, ...lookups].join('\n') }\n`, map: null };
    },
  };
}
