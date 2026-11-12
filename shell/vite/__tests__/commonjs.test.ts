import { parseSync } from '@babel/core';
import {
  MAY_BE_COMMONJS, REQUIRE_FILE, isCommonJS, withoutEmptyExports, wrapCommonJS
} from '@shell/vite/commonjs.mjs';

const parse = (code: string) => {
  const parsed = parseSync(code, {
    sourceType: 'module', configFile: false, babelrc: false, parserOpts: { plugins: ['estree'] }
  });

  if (!parsed) {
    throw new Error('Could not parse the code');
  }

  return parsed.program;
};

const requireFile = new Function(`${ REQUIRE_FILE }\nreturn __rancher_require_file__;`)(); // eslint-disable-line no-new-func

const evaluate = (code: string): Record<string, any> => {
  const exported: Record<string, unknown> = {};
  const body = code
    .replace(/^export { (\w+) as (\w+) };$/gm, 'exported.$2 = $1;')
    .replace(/^export { (\w+) };$/gm, 'exported.$1 = $1;')
    .replace(/^export default (.*);$/gm, 'exported.default = $1;');

  new Function('exported', body)(exported); // eslint-disable-line no-new-func

  return exported;
};

const wrap = (code: string) => evaluate(wrapCommonJS(code, parse(code)));

const LEGACY = `module.exports = function legacy() {\n  return 'legacy called';\n};\n`;

describe('fx: MAY_BE_COMMONJS', () => {
  it.each([
    ['module.exports = a;', true],
    ['exports.a = 1;', true],
    ['Object.defineProperty(exports, \'a\', {});', true],
    ['export default a;', false],
  ])('should say whether %p may be CommonJS', (code, expected) => {
    expect(MAY_BE_COMMONJS.test(code)).toStrictEqual(expected);
  });
});

describe('fx: isCommonJS', () => {
  it.each([
    ['sets module.exports', 'module.exports = {};'],
    ['sets a name on exports', 'exports.a = 1;'],
    ['defines a name on exports', 'Object.defineProperty(exports, \'a\', { value: 1 });'],
    ['TypeScript left an empty export in, for imports that were all types', 'module.exports = {};\nexport {};'],
    ['checks new.target, which is not import.meta', 'function Legacy() {\n  this.called = !!new.target;\n}\nmodule.exports = Legacy;'],
  ])('should accept a file that %s', (_, code) => {
    expect(isCommonJS(parse(code))).toStrictEqual(true);
  });

  it.each([
    ['imports', 'import a from \'./a\';\nmodule.exports = a;'],
    ['exports', 'export const a = 1;\nmodule.exports = a;'],
    ['uses import.meta', 'module.exports = import.meta.url;'],
    ['declares exports itself', 'const exports = {};\nexports.a = 1;'],
    ['declares exports by destructuring', 'const { exports } = load();\nexports.a = 1;'],
    ['declares module itself', 'function module() {}\nmodule.exports = 1;'],
    ['only names module.exports in a string', 'console.log(\'module.exports\');'],
  ])('should refuse a file that %s', (_, code) => {
    expect(isCommonJS(parse(code))).toStrictEqual(false);
  });
});

describe('fx: withoutEmptyExports', () => {
  it('should blank each empty export, and keep every other character where it was', () => {
    const code = 'module.exports = {};\nexport {};\n';

    expect(withoutEmptyExports(code, parse(code))).toStrictEqual('module.exports = {};\n          \n');
  });
});

describe('fx: wrapCommonJS', () => {
  it('should export module.exports as the default', () => {
    expect(wrap(LEGACY).default()).toStrictEqual('legacy called');
  });

  it('should export the default of a file that sets __esModule as the default', () => {
    expect(wrap('Object.defineProperty(exports, \'__esModule\', { value: true });\nexports.default = \'the default\';\n').default).toStrictEqual('the default');
  });

  it('should give require() module.exports', () => {
    expect(requireFile(wrap(LEGACY))()).toStrictEqual('legacy called');
  });

  it('should give require() the namespace of an ES module that export *s a CommonJS file', () => {
    const { default: _default, ...reExported } = wrap('exports.a = 1;\n');
    const namespace = { ...reExported, b: 2 };

    expect(requireFile(namespace)).toStrictEqual(namespace);
  });

  it.each([
    ['set on exports', 'exports.a = 1;\nexports[\'b\'] = 2;\nmodule.exports.c = 3;\nexports[key] = 4;\n'],
    ['set as an object', 'const b = 2;\nmodule.exports = { a: 1, b, \'c\': 3, \'not-a-name\': 4 };\n'],
    ['set as an object declared first', 'const api = { a: 1, b: 2, c: 3 };\nmodule.exports = api;\n'],
    ['defined on exports', 'Object.defineProperty(exports, \'a\', { enumerable: true, value: 1 });\nexports.b = 2;\nexports.c = 3;\n'],
    ['assigned to module.exports', 'Object.assign(module.exports, { a: 1, b: 2 }, { c: 3 });\n'],
  ])('should export each name %s', (_, code) => {
    const { default: _default, __rancher_commonjs__: _marker, ...named } = evaluate(wrapCommonJS(`var key = 'd';\n${ code }`, parse(`var key = 'd';\n${ code }`)));

    expect(named).toStrictEqual({
      a: 1, b: 2, c: 3
    });
  });

  it('should run the code with module.exports as this', () => {
    const legacy = wrap('module.exports.self = this;\n');

    expect(legacy.self).toBe(requireFile(legacy));
  });

  it('should keep the line numbers of the code', () => {
    const [firstLine] = wrapCommonJS(LEGACY, parse(LEGACY)).split('\n');

    expect(firstLine).toMatch(/\(function\(module, exports\) {module\.exports = function legacy\(\) {$/);
  });

  it('should give code that parses as a module', () => {
    expect(parse(wrapCommonJS(LEGACY, parse(LEGACY))).type).toStrictEqual('Program');
  });
});
