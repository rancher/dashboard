import fs from 'fs';
import os from 'os';
import path from 'path';
import { loadChunksOnDemand } from '@shell/pkg/chunk-loader.mjs';

const NAME = 'pkg-1.0.0';
const ENTRY = `${ NAME }.umd.min.js`;

const CHUNKS = [
  {
    fileName:  ENTRY,
    isEntry:   true,
    imports:   ['pkg.initial.js', 'vue'],
    moduleIds: ['/pkg/index.js'],
    code:      `const initial = require('./pkg.initial.js');
const vue = require('vue');
exports.default = function(plugin) {
  plugin.shared = initial.shared();
  plugin.vue = vue.version;
  plugin.load = () => Promise.resolve().then(() => require('./pkg.lazy.js'));
  plugin.loadMissing = () => Promise.resolve().then(() => require('./pkg.missing.js'));
};`,
  },
  {
    fileName: 'pkg.initial.js', isEntry: false, imports: [], moduleIds: ['/pkg/initial.js'], code: 'exports.shared = function() { return \'shared\'; };'
  },
  {
    fileName: 'pkg.lazy.js', isEntry: false, imports: ['pkg.util.js'], moduleIds: ['/pkg/lazy.js'], code: 'const util = require(\'./pkg.util.js\');\nexports.default = \'lazy \' + util.util;\nexports.strict = util.strict;'
  },
  {
    fileName: 'pkg.util.js', isEntry: false, imports: [], moduleIds: ['/pkg/util.js'], code: 'exports.util = \'util\';\nexports.strict = (function() { return this === undefined; })();'
  },
];

const magicString = (code: string) => {
  let out = code;

  return {
    prepend(text: string) {
      out = text + out;
    },
    append(text: string) {
      out += text;
    },
    toString: () => out,
  };
};

describe('fx: loadChunksOnDemand', () => {
  let dir: string;
  let appended: string[];
  let sources: string[];

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rancher-chunks-'));
    appended = [];
    sources = [];

    const plugin: any = loadChunksOnDemand(NAME, ENTRY, { vue: 'Vue' });
    const bundle: Record<string, any> = {};

    CHUNKS.forEach(({ code, ...chunk }) => {
      const rendered = plugin.renderChunk(code, chunk, {}, { magicString: magicString(code) }).toString();

      bundle[chunk.fileName] = { type: 'chunk', ...chunk };
      fs.writeFileSync(path.join(dir, chunk.fileName), `${ rendered }//# sourceMappingURL=${ chunk.fileName }.map\n`);
      fs.writeFileSync(path.join(dir, `${ chunk.fileName }.map`), JSON.stringify({
        version: 3, sources: [chunk.fileName], names: [], mappings: 'AAAA'
      }));
    });

    plugin.generateBundle({}, bundle);
    plugin.writeBundle({ dir });

    (window as any).Vue = { version: '3' };
    jest.spyOn(document.head, 'appendChild').mockImplementation((element: any) => {
      const file = element.src.split('/').pop();

      appended.push(file);
      sources.push(element.src);
      if (fs.existsSync(path.join(dir, file))) {
        new Function(fs.readFileSync(path.join(dir, file), 'utf8'))(); // eslint-disable-line no-new-func
        element.onload();
      } else {
        element.onerror();
      }

      return element;
    });
  });

  const runScript = (src?: string) => {
    Object.defineProperty(document, 'currentScript', { value: src ? { src } : null, configurable: true });
    new Function(fs.readFileSync(path.join(dir, ENTRY), 'utf8'))(); // eslint-disable-line no-new-func
  };

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
    delete (window as any)[NAME];
    delete (window as any).Vue;
    delete (self as any).__rancherExtensionChunks;
  });

  it('should make the entry, and the chunks it imports, one script', () => {
    expect(fs.readdirSync(dir).sort()).toStrictEqual([ENTRY, `${ ENTRY }.map`, 'pkg.lazy.js', 'pkg.lazy.js.map', 'pkg.util.js', 'pkg.util.js.map']);
  });

  it('should give the script a sourcemap of each part', () => {
    const map = JSON.parse(fs.readFileSync(path.join(dir, `${ ENTRY }.map`), 'utf8'));

    expect(map.sections.map((section: any) => section.map.sources)).toStrictEqual([['pkg.initial.js'], [ENTRY]]);
  });

  it('should set the entry module on window when the script runs', () => {
    const plugin: any = {};

    runScript();
    (window as any)[NAME].default(plugin);

    expect(plugin.shared).toStrictEqual('shared');
    expect(plugin.vue).toStrictEqual('3');
    expect(appended).toStrictEqual([]);
  });

  it('should load a lazy chunk, and the chunks it needs, when it is imported', async() => {
    const plugin: any = {};

    runScript();
    (window as any)[NAME].default(plugin);

    expect((await plugin.load()).default).toStrictEqual('lazy util');
    expect(appended.sort()).toStrictEqual(['pkg.lazy.js', 'pkg.util.js']);
  });

  it('should load a chunk once', async() => {
    const plugin: any = {};

    runScript();
    (window as any)[NAME].default(plugin);
    await Promise.all([plugin.load(), plugin.load()]);
    await plugin.load();

    expect(appended.sort()).toStrictEqual(['pkg.lazy.js', 'pkg.util.js']);
  });

  it('should run chunk code in strict mode', async() => {
    const plugin: any = {};

    runScript();
    (window as any)[NAME].default(plugin);

    expect((await plugin.load()).strict).toStrictEqual(true);
  });

  it('should reject a module the package does not have', async() => {
    const plugin: any = {};

    runScript();
    (window as any)[NAME].default(plugin);

    await expect(plugin.loadMissing()).rejects.toThrow("Cannot find module './pkg.missing.js'");
  });

  it('should reject when a chunk cannot be loaded, and load it when asked again', async() => {
    const plugin: any = {};
    const util = fs.readFileSync(path.join(dir, 'pkg.util.js'), 'utf8');

    runScript();
    (window as any)[NAME].default(plugin);
    fs.rmSync(path.join(dir, 'pkg.util.js'));

    await expect(plugin.load()).rejects.toThrow(/Could not load .*pkg\.util\.js$/);

    fs.writeFileSync(path.join(dir, 'pkg.util.js'), util);

    expect((await plugin.load()).default).toStrictEqual('lazy util');
  });

  it('should reject when a chunk script runs but does not register itself', async() => {
    const plugin: any = {};

    runScript();
    (window as any)[NAME].default(plugin);
    fs.writeFileSync(path.join(dir, 'pkg.util.js'), '/* not a chunk */');

    await expect(plugin.load()).rejects.toThrow(/Could not load .*pkg\.util\.js$/);
  });

  it('should load chunks from beside the script, whatever its query string', async() => {
    const plugin: any = {};

    runScript('https://rancher.example/plugin/pkg-1.0.0.umd.min.js?ref=a/b');
    (window as any)[NAME].default(plugin);
    await plugin.load();

    expect(sources.sort()).toStrictEqual(['https://rancher.example/plugin/pkg.lazy.js', 'https://rancher.example/plugin/pkg.util.js']);
  });
});

describe('fx: loadChunksOnDemand with a top-level await', () => {
  const { parseSync } = require('@babel/core');
  const { MagicString } = require('vue/compiler-sfc');

  const context = {
    parse: (code: string) => parseSync(code, {
      sourceType: 'module', configFile: false, babelrc: false, parserOpts: { plugins: ['estree'] }
    }).program,
    error: (message: string) => {
      throw new Error(message);
    },
  };

  const AWAITING_CHUNKS = [
    {
      fileName:  ENTRY,
      isEntry:   true,
      imports:   [],
      moduleIds: ['/pkg/index.js'],
      code:      'exports.default = function(plugin) {\n  plugin.load = () => Promise.resolve().then(() => require(\'./pkg.page.js\'));\n};',
    },
    {
      fileName: 'pkg.page.js', isEntry: false, imports: ['pkg.ready.js'], moduleIds: ['/pkg/page.js'], code: 'const ready = require(\'./pkg.ready.js\');\nexports.default = \'page \' + ready.value;'
    },
    {
      fileName: 'pkg.ready.js', isEntry: false, imports: [], moduleIds: ['/pkg/ready.js'], code: 'exports.value = __rancherTopLevelAwait( Promise.resolve(\'ready\'));'
    },
  ];

  let dir: string;

  const build = (chunks: typeof AWAITING_CHUNKS) => {
    const plugin: any = loadChunksOnDemand(NAME, ENTRY);
    const bundle: Record<string, any> = {};
    const meta = Object.fromEntries(chunks.map(({ code, ...chunk }) => [chunk.fileName, chunk]));

    plugin.transform.handler.call(context, 'export const value = await Promise.resolve(\'ready\');', '/pkg/ready.js', { moduleType: 'js' });
    plugin.renderStart();
    chunks.forEach(({ code, ...chunk }) => {
      bundle[chunk.fileName] = { type: 'chunk', ...chunk };
      fs.writeFileSync(path.join(dir, chunk.fileName), plugin.renderChunk.call(context, code, chunk, {}, { chunks: meta, magicString: new MagicString(code) }).toString());
    });
    plugin.generateBundle.call(context, {}, bundle);
    plugin.writeBundle({ dir });
  };

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rancher-chunks-'));
    jest.spyOn(document.head, 'appendChild').mockImplementation((element: any) => {
      new Function(fs.readFileSync(path.join(dir, element.src.split('/').pop()), 'utf8'))(); // eslint-disable-line no-new-func
      element.onload();

      return element;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
    delete (window as any)[NAME];
    delete (self as any).__rancherExtensionChunks;
  });

  it('should hide a top-level await from the bundler, and leave the awaits in functions', () => {
    const plugin: any = loadChunksOnDemand(NAME, ENTRY);
    const code = 'export const value = await load();\nexport async function reload() {\n  return await load();\n}';

    expect(plugin.transform.handler.call(context, code, '/pkg/ready.js', { moduleType: 'js' }).code).toStrictEqual('export const value = __rancherTopLevelAwait( load());\nexport async function reload() {\n  return await load();\n}');
  });

  it.each([
    ['a module whose awaits are all in functions', 'export async function load() {\n  return await fetch();\n}', 'js'],
    ['a stylesheet', '.await { color: red; }', 'css'],
  ])('should leave %s as it is', (_, code, moduleType) => {
    const plugin: any = loadChunksOnDemand(NAME, ENTRY);

    expect(plugin.transform.handler.call(context, code, '/pkg/file', { moduleType })).toBeNull();
  });

  it('should wait for a chunk with a top-level await, in the chunks that import it', async() => {
    const plugin: any = {};

    build(AWAITING_CHUNKS);
    Object.defineProperty(document, 'currentScript', { value: null, configurable: true });
    new Function(fs.readFileSync(path.join(dir, ENTRY), 'utf8'))(); // eslint-disable-line no-new-func
    (window as any)[NAME].default(plugin);

    expect((await plugin.load()).default).toStrictEqual('page ready');
  });

  it('should refuse a top-level await the package\'s index imports', () => {
    const [entry, , ready] = AWAITING_CHUNKS;

    expect(() => build([{ ...entry, imports: ['pkg.ready.js'] }, ready])).toThrow('The package\'s index imports a module with a top-level `await` (/pkg/ready.js)');
  });
});
