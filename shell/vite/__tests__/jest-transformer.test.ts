import path from 'path';
import { rewrite } from '@shell/vite/jest-transformer';

const META = ['import', 'meta'].join('.');
const FORMATTERS = path.resolve(__dirname, '../../components/formatter');
const IMPORTER = path.join(FORMATTERS, 'importer.js');

const evaluate = (code: string, required: (file: string) => any) => {
  const module = { exports: {} as any };

  new Function('module', 'require', code)(module, required); // eslint-disable-line no-new-func

  return module.exports;
};

describe('fx: jest-transformer rewrite', () => {
  it('should leave code that does not use vite features alone', () => {
    const source = 'module.exports = 1;';

    expect(rewrite(source, IMPORTER)).toBe(source);
  });

  it('should replace the hot module API with undefined', () => {
    expect(rewrite(`if (${ META }.hot) { ${ META }.hot.accept(); }`, IMPORTER)).toStrictEqual('if (undefined) { undefined.accept(); }');
  });

  it('should key a glob by the path from the importer and load each module when asked', async() => {
    const required = jest.fn((file: string) => ({ file }));
    const modules = evaluate(rewrite(`module.exports = ${ META }.glob('./[A-Z]*.vue');`, IMPORTER), required);

    expect(Object.keys(modules)).toContain('./BadgeStateFormatter.vue');
    expect(required).not.toHaveBeenCalledWith(path.join(FORMATTERS, 'BadgeStateFormatter.vue'));
    expect(await modules['./BadgeStateFormatter.vue']()).toStrictEqual({ file: path.join(FORMATTERS, 'BadgeStateFormatter.vue') });
  });

  it('should leave out files that match a negative pattern', () => {
    const modules = evaluate(rewrite(`module.exports = ${ META }.glob(['./**/*.ts', '!**/__tests__/**']);`, IMPORTER), jest.fn());

    expect(Object.keys(modules).filter((key) => key.includes('__tests__'))).toStrictEqual([]);
  });

  it('should require an eagerly imported module the first time it is read', () => {
    const required = jest.fn((file: string) => ({ file }));
    const modules = evaluate(rewrite(`module.exports = ${ META }.glob('./BadgeStateFormatter.vue', { eager: true });`, IMPORTER), required);

    expect(required).not.toHaveBeenCalledWith(path.join(FORMATTERS, 'BadgeStateFormatter.vue'));
    expect(modules['./BadgeStateFormatter.vue']).toStrictEqual({ file: path.join(FORMATTERS, 'BadgeStateFormatter.vue') });
  });

  it.each([
    ['the default export of an ES module', { __esModule: true, default: 'url' }, 'url'],
    ['the whole of a CommonJS module', { file: 'url' }, { file: 'url' }],
  ])('should import %s when the default import is asked for', (_, module, expected) => {
    const modules = evaluate(rewrite(`module.exports = ${ META }.glob('./BadgeStateFormatter.vue', { eager: true, import: 'default' });`, IMPORTER), () => module);

    expect(modules['./BadgeStateFormatter.vue']).toStrictEqual(expected);
  });
});
