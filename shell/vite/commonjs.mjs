import { isMember, walk } from './ast.mjs';

const MARKER = '__rancher_commonjs__';
const MODULE = '__rancher_commonjs_module__';
const ESM_SYNTAX = ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportDefaultDeclaration', 'ExportAllDeclaration'];
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const NOT_NAMED_EXPORTS = ['default', '__esModule', MARKER];

/**
 * Matches code that may set `module.exports` or `exports`. A file that does not match is not CommonJS.
 */
export const MAY_BE_COMMONJS = /\bmodule\.exports\b|\bexports\s*[.[,)]/;

/**
 * The code of `__rancher_require_file__(namespace)`, which gives what `require()` gives for the file a namespace was
 * imported from: `module.exports` for a CommonJS file that `wrapCommonJS` wrapped, and the namespace for anything else,
 * such as an ES module that `export *`s a CommonJS file.
 */
export const REQUIRE_FILE = `function __rancher_require_file__(namespace) {
  var commonJS = namespace && typeof namespace === 'object' ? namespace.${ MARKER } : undefined;
  var own = commonJS && 'default' in namespace && namespace.default === commonJS.default;

  return own ? commonJS.exports : namespace;
}`;

const isModuleExports = (node) => isMember(node, 'exports', 'module');
const isExports = (node) => (node?.type === 'Identifier' && node.name === 'exports') || isModuleExports(node);
const usesExports = (node) => (node.type === 'MemberExpression' && (isExports(node) || isExports(node.object))) || (node.type === 'CallExpression' && node.arguments.some(isExports));
const isImportMeta = (node) => node.type === 'MetaProperty' && node.meta.name === 'import';
const isEmptyExport = (node) => node.type === 'ExportNamedDeclaration' && !node.declaration && !node.source && !node.specifiers.length;

function boundNames(pattern) {
  switch (pattern?.type) {
  case 'Identifier':
    return [pattern.name];
  case 'ObjectPattern':
    return pattern.properties.flatMap((property) => boundNames(property.type === 'RestElement' ? property.argument : property.value));
  case 'ArrayPattern':
    return pattern.elements.flatMap(boundNames);
  case 'AssignmentPattern':
    return boundNames(pattern.left);
  case 'RestElement':
    return boundNames(pattern.argument);
  default:
    return [];
  }
}

function declares(statement, name) {
  if (statement.type === 'VariableDeclaration') {
    return statement.declarations.some((declaration) => boundNames(declaration.id).includes(name));
  }

  return statement.id?.name === name;
}

function keyName(key, computed) {
  if (!computed && key.type === 'Identifier') {
    return key.name;
  }

  return typeof key.value === 'string' ? key.value : undefined;
}

function topLevelValue(program, name) {
  const declarations = program.body.flatMap((statement) => (statement.type === 'VariableDeclaration' ? statement.declarations : []));

  return declarations.find((declaration) => declaration.id.name === name)?.init;
}

/**
 * Whether a file is CommonJS: it uses `module.exports` or `exports`, does not declare either itself, and has no import,
 * export or `import.meta`. The `export {}` that TypeScript leaves in a file whose imports are all types is not counted.
 *
 * @param {object} program the file parsed as ESTree
 */
export function isCommonJS(program) {
  let esm = false;
  let usesCommonJS = false;

  walk(program, (node) => {
    esm = esm || (ESM_SYNTAX.includes(node.type) && !isEmptyExport(node)) || isImportMeta(node);
    usesCommonJS = usesCommonJS || usesExports(node);
  });

  return !esm && usesCommonJS && !program.body.some((statement) => declares(statement, 'module') || declares(statement, 'exports'));
}

/**
 * A CommonJS file's code with each `export {}` blanked out, keeping every other character where it was, so that it can
 * run in a function.
 *
 * @param {string} code the file's code
 * @param {object} program `code` parsed as ESTree
 */
export function withoutEmptyExports(code, program) {
  return program.body.filter(isEmptyExport).reduceRight((out, node) => `${ out.slice(0, node.start) }${ ' '.repeat(node.end - node.start) }${ out.slice(node.end) }`, code);
}

function exportedNames(program) {
  const names = new Set();
  const objects = [];

  walk(program, (node) => {
    if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' && isExports(node.left.object)) {
      names.add(keyName(node.left.property, node.left.computed));
    } else if (node.type === 'AssignmentExpression' && isModuleExports(node.left)) {
      objects.push(node.right);
    } else if (node.type === 'CallExpression' && isMember(node.callee, 'defineProperty', 'Object') && isExports(node.arguments[0])) {
      names.add(node.arguments[1]?.value);
    } else if (node.type === 'CallExpression' && isMember(node.callee, 'assign', 'Object') && isExports(node.arguments[0])) {
      objects.push(...node.arguments.slice(1));
    }
  });

  objects.map((value) => (value.type === 'Identifier' ? topLevelValue(program, value.name) : value)).forEach((object) => {
    if (object?.type !== 'ObjectExpression') {
      return;
    }

    object.properties.forEach((property) => {
      if (property.type === 'Property') {
        names.add(keyName(property.key, property.computed));
      }
    });
  });

  return [...names].filter((name) => typeof name === 'string' && IDENTIFIER.test(name) && !NOT_NAMED_EXPORTS.includes(name));
}

/**
 * The ES module for a CommonJS file, which runs the file's code in a function of `(module, exports)`. Its default export
 * is `module.exports`, or `module.exports.default` when the file sets `__esModule`, and it exports each name the file
 * can be seen to set: `exports.name = ...`, `Object.defineProperty(exports, 'name', ...)`, and each key of an object
 * literal, or of a top-level variable that holds one, given to `module.exports = ...` or `Object.assign(module.exports,
 * ...)`. `REQUIRE_FILE` gives `module.exports` itself. The code keeps its line numbers.
 *
 * @param {string} code the file's code, which may have been changed in ways that do not change what it exports
 * @param {object} program the file, parsed as ESTree, which `isCommonJS` accepts
 */
export function wrapCommonJS(code, program) {
  return [
    `var ${ MODULE } = { exports: {} }; (function(module, exports) {${ code }`,
    `}).call(${ MODULE }.exports, ${ MODULE }, ${ MODULE }.exports);`,
    `var ${ MARKER } = { exports: ${ MODULE }.exports, default: ${ MODULE }.exports && ${ MODULE }.exports.__esModule ? ${ MODULE }.exports.default : ${ MODULE }.exports };`,
    `export { ${ MARKER } };`,
    `export default ${ MARKER }.default;`,
    ...exportedNames(program).map((name, i) => `var __rancher_commonjs_${ i }__ = ${ MODULE }.exports[${ JSON.stringify(name) }];\nexport { __rancher_commonjs_${ i }__ as ${ name } };`),
  ].join('\n');
}
