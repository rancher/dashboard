import fs from 'node:fs';
import path from 'node:path';
import { isFunction, walk } from './ast.mjs';
import {
  MAY_BE_COMMONJS, REQUIRE_FILE, isCommonJS, withoutEmptyExports, wrapCommonJS
} from './commonjs.mjs';

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

const LOGICAL_ASSIGNMENT = ['||=', '&&=', '??='];

function optionalBefore(node) {
  for (let link = node; link?.type === 'CallExpression' || link?.type === 'MemberExpression'; link = link.callee || link.object) {
    if (link.optional) {
      return true;
    }
  }

  return false;
}

const RUNS_SOMETIMES = {
  IfStatement:           (node, child) => child !== node.test,
  ConditionalExpression: (node, child) => child !== node.test,
  LogicalExpression:     (node, child) => child === node.right,
  AssignmentExpression:  (node, child) => LOGICAL_ASSIGNMENT.includes(node.operator) && child === node.right,
  AssignmentPattern:     (node, child) => child === node.right,
  CallExpression:        (node, child) => node.arguments.includes(child) && optionalBefore(node),
  MemberExpression:      (node, child) => node.computed && child === node.property && optionalBefore(node),
  PropertyDefinition:    (node, child) => !node.static && child === node.value,
  ClassProperty:         (node, child) => !node.static && child === node.value,
  SwitchCase:            (node, child) => child !== node.test,
  CatchClause:           () => true,
  ForStatement:          (node, child) => child !== node.init,
  ForInStatement:        (node, child) => child === node.body,
  ForOfStatement:        (node, child) => child === node.body,
  WhileStatement:        (node, child) => child === node.body,
  DoWhileStatement:      (node, child) => child === node.body,
};

function laterThanLoad(call, ancestors) {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const node = ancestors[i];
    const child = ancestors[i + 1] || call;

    if (isFunction(node)) {
      return 'in a function';
    }

    if (node.type === 'TryStatement' && child === node.block) {
      return 'in a try';
    }

    if (RUNS_SOMETIMES[node.type]?.(node, child)) {
      return 'in a condition';
    }
  }

  return undefined;
}

function requireCalls(code, program) {
  const calls = [];

  walk(program, (node, _, ancestors) => {
    const [arg, ...others] = node.type === 'CallExpression' ? node.arguments : [];
    const string = arg?.type === 'Literal' && typeof arg.value === 'string';

    if ((!string && arg?.type !== 'TemplateLiteral') || others.length || node.callee.type !== 'Identifier' || node.callee.name !== 'require') {
      return;
    }

    const template = !string && arg.expressions.length ? {
      raw: code.slice(arg.start + 1, arg.end - 1), first: arg.quasis[0].value.cooked, last: arg.quasis[arg.quasis.length - 1].value.cooked
    } : undefined;
    const source = string ? arg.value : arg.quasis[0].value.cooked;
    const ending = string ? arg.value : arg.quasis[arg.quasis.length - 1].value.cooked;

    if (template || source) {
      calls.push({
        start: node.start, end: node.end, call: code.slice(node.start, node.end), argStart: arg.start, argEnd: arg.end, source: template ? undefined : source, template, asValue: REQUIRED_AS_VALUE.test(cleanId(ending)), where: laterThanLoad(node, ancestors)
      });
    }
  });

  return calls.sort((a, b) => a.start - b.start);
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
 * is imported, and runs, when the file that requires it loads, and a CommonJS `.js` or `.ts` file becomes an ES module
 * that runs its code in a function of `(module, exports)`, as `wrapCommonJS` describes. A `require()` of a module
 * inside a function, a `try` or a condition runs there when the file loads instead of when the call is reached, so the
 * dev server warns about each one at its file and line. Only code in the app's pkg folder is changed.
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
      const requires = code.includes('require(');
      const mayBeCommonJS = SCRIPT_FILE.test(file) && MAY_BE_COMMONJS.test(code);
      const program = (requires || (!build && mayBeCommonJS && !CLASSIC_WORKER.test(id))) ? parseCode(this, code) : undefined;
      const commonJS = !build && program !== undefined && mayBeCommonJS && !CLASSIC_WORKER.test(id) && isCommonJS(program);

      if (!program || (!commonJS && !requires)) {
        return;
      }

      const calls = requires ? requireCalls(code, program) : [];

      if (!build) {
        calls.filter(({ where, asValue }) => where && !asValue).forEach(({ call, where, start }) => {
          this.warn(`${ call.replace(/\s+/g, ' ') } ${ where } runs when this file loads under yarn dev, not when the call is reached; if the module throws, it stops the dashboard. Use import() to load it on demand.`, start);
        });
      }

      const imports = new Map();
      const contexts = [];
      const helpers = new Set();

      const requireOf = ({ call, source, asValue }) => {
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
      };

      const contextOf = ({ call, template: { raw, first, last } }, expression) => {
        const dir = first.slice(0, first.lastIndexOf('/') + 1);
        const folder = dir && folderFor(dir, file);
        const key = dir && (build ? dir : keyFor(dir));

        if (!folder || !key) {
          this.warn(`${ file }: require(\`${ raw }\`) cannot be bundled, so it will throw when it runs: start its path with a folder`);

          return call;
        }

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

        return `__rancher_require_context__(${ name }(), ${ JSON.stringify(dir) }, ${ JSON.stringify(key) }, ${ expression })`;
      };

      const replacements = [];

      for (let i = calls.length - 1; i >= 0; i--) {
        const call = calls[i];
        const inner = replacements.filter(({ start, end }) => start > call.start && end < call.end);
        const arg = inner.reduce((text, { start, end, replacement }) => `${ text.slice(0, start - call.argStart) }${ replacement }${ text.slice(end - call.argStart) }`, code.slice(call.argStart, call.argEnd));
        const replacement = call.template ? contextOf(call, arg) : requireOf(call);

        for (let j = replacements.length - 1; j >= 0; j--) {
          if (replacements[j].start > call.start && replacements[j].end < call.end) {
            replacements.splice(j, 1);
          }
        }

        replacements.push({ ...call, replacement });
      }

      const out = replacements.reduce((text, { start, end, replacement }) => `${ text.slice(0, start) }${ replacement }${ text.slice(end) }`, commonJS ? withoutEmptyExports(code, program) : code);

      const transformed = commonJS ? wrapCommonJS(out, program) : out;

      if (transformed === code) {
        return;
      }

      const declarations = [...imports].map(([source, name]) => (REQUIRED_AS_VALUE.test(cleanId(source)) ? `import ${ name } from ${ JSON.stringify(source) };` : `import * as ${ name } from ${ JSON.stringify(source) };`));

      return { code: `${ transformed }\n${ [...declarations, ...contexts, ...helpers].join('\n') }\n`, map: null };
    },
  };
}
