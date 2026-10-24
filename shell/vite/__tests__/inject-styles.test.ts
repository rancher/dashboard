import { injectStyles } from '@shell/vite/inject-styles.mjs';

const chunk = (fileName: string, code: string, css: string[] = [], isEntry = false) => ({
  type: 'chunk', fileName, code, isEntry, viteMetadata: { importedCss: new Set(css) }
});
const asset = (fileName: string, source: string) => ({
  type: 'asset', fileName, source
});

const build = (files: any[]) => {
  const bundle = Object.fromEntries(files.map((file) => [file.fileName, file]));

  (injectStyles() as any).generateBundle({}, bundle);

  return bundle;
};

const injected = (code: string) => [...code.matchAll(/createTextNode\(("(?:[^"\\]|\\.)*")\)/g)].map((match) => JSON.parse(match[1]));

describe('fx: injectStyles', () => {
  it('should add the styles of each chunk to that chunk', () => {
    const bundle = build([
      chunk('entry.js', 'entry();', ['entry.css'], true),
      chunk('lazy.js', 'lazy();', ['lazy.css']),
      asset('entry.css', '.entry{}'),
      asset('lazy.css', '.lazy{}'),
    ]);

    expect(injected(bundle['entry.js'].code)).toStrictEqual(['.entry{}']);
    expect(injected(bundle['lazy.js'].code)).toStrictEqual(['.lazy{}']);
  });

  it('should add styles that no chunk claims to the entry', () => {
    const bundle = build([
      chunk('entry.js', 'entry();', [], true),
      asset('style.css', '.all{}'),
    ]);

    expect(injected(bundle['entry.js'].code)).toStrictEqual(['.all{}']);
  });

  it('should not emit the stylesheets', () => {
    const bundle = build([
      chunk('entry.js', 'entry();', ['entry.css'], true),
      asset('entry.css', '.entry{}'),
    ]);

    expect(Object.keys(bundle)).toStrictEqual(['entry.js']);
  });

  it('should keep the source map comment last', () => {
    const bundle = build([
      chunk('entry.js', 'entry();\n//# sourceMappingURL=entry.js.map', ['entry.css'], true),
      asset('entry.css', '.entry{}'),
    ]);

    expect(bundle['entry.js'].code.endsWith('//# sourceMappingURL=entry.js.map')).toStrictEqual(true);
  });

  it('should leave a chunk without styles alone', () => {
    const bundle = build([
      chunk('entry.js', 'entry();', [], true),
      chunk('lazy.js', 'lazy();'),
    ]);

    expect(bundle['lazy.js'].code).toStrictEqual('lazy();');
  });
});
