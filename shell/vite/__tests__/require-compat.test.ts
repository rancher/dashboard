import fs from 'fs';
import os from 'os';
import path from 'path';
import { rancherRequireCompat } from '@shell/vite/require-compat.mjs';

const ROOT = '/app';
const warn = jest.fn();
const transform = (code: string, id = `${ ROOT }/pkg/thing/index.ts`, command = 'serve', root = ROOT) => {
  const plugin: any = rancherRequireCompat({ root });

  plugin.configResolved({
    root: `${ root }/pkg/thing`, command, resolve: { alias: [{ find: '@shell', replacement: `${ root }/pkg/thing/.shell` }] }
  });

  return plugin.transform.call({ warn }, code, id);
};

const run = (code: string, files: Record<string, unknown>) => {
  const glob = ([pattern]: string[]) => {
    const folder = pattern.slice(0, pattern.indexOf('**')).replace(/^@shell\//, '/.shell/');

    return Object.fromEntries(Object.entries(files).filter(([file]) => file.startsWith(folder)));
  };
  const source = transform(code).code.replace(/import\.meta\.glob\(/g, 'glob(');

  return new Function('glob', `${ source }\nreturn load;`)(glob); // eslint-disable-line no-new-func
};

describe('fx: rancherRequireCompat', () => {
  it('should import a required module as its namespace', () => {
    const code = `const { thing } = require('./thing');\n`;

    expect(transform(code).code).toStrictEqual(`const { thing } = __rancher_require_0__;\n\nimport * as __rancher_require_0__ from "./thing";\n`);
  });

  it.each([
    ['an image', './logo.svg'],
    ['json', './package.json'],
    ['yaml', '../l10n/en-us.yaml'],
    ['an asset with a query', './logo.png?url'],
  ])('should import %s as its value', (_, source) => {
    expect(transform(`const value = require('${ source }');`).code).toStrictEqual(`const value = __rancher_require_0__;\nimport __rancher_require_0__ from ${ JSON.stringify(source) };\n`);
  });

  it('should import each module once', () => {
    const code = `const a = require('./a');\nconst b = require("./b");\nconst c = require(\`./a\`);`;

    expect(transform(code).code).toStrictEqual(`const a = __rancher_require_0__;\nconst b = __rancher_require_1__;\nconst c = __rancher_require_0__;\nimport * as __rancher_require_0__ from "./a";\nimport * as __rancher_require_1__ from "./b";\n`);
  });

  it.each([
    ['a file outside the pkg folder', `const a = require('./a');`, `${ ROOT }/shell/thing.js`],
    ['a dependency of a package', `const a = require('./a');`, `${ ROOT }/pkg/thing/node_modules/dep/index.js`],
    ['a file that is not code', `const a = require('./a');`, `${ ROOT }/pkg/thing/styles.scss`],
    ['a method called require', `const a = store.require('./a');`, `${ ROOT }/pkg/thing/index.ts`],
    ['code without require', `import a from './a';`, `${ ROOT }/pkg/thing/index.ts`],
  ])('should leave %s alone', (_, code, id) => {
    expect(transform(code, id)).toBeUndefined();
  });

  describe('with a path built from a template', () => {
    const MODELS = {
      '/.shell/models/pod.js':                    { pod: true },
      '/.shell/models/fleet.cattle.io.policy.ts': { policy: true },
      '/.shell/models/management/index.js':       { management: true },
    };

    it.each([
      ['pod', { pod: true }],
      ['fleet.cattle.io.policy', { policy: true }],
      ['management', { management: true }],
    ])('should load %p from every module the folder holds', (type, model) => {
      const load = run(`function load(type) {\n  return require(\`@shell/models/\${ type }\`);\n}`, MODELS);

      expect(load(type)).toStrictEqual(model);
    });

    it('should load the value of an asset', () => {
      const load = run(`const load = (name) => require(\`./icons/\${ name }.svg\`);`, { './icons/aws.svg': { [Symbol.toStringTag]: 'Module', default: 'aws.svg' } });

      expect(load('aws')).toStrictEqual('aws.svg');
    });

    it('should throw MODULE_NOT_FOUND for a module the folder does not hold', () => {
      const load = run(`function load(type) {\n  return require(\`@shell/models/\${ type }\`);\n}`, MODELS);

      expect(() => load('missing')).toThrow(expect.objectContaining({ message: 'Cannot find module \'@shell/models/missing\'', code: 'MODULE_NOT_FOUND' }));
    });

    it('should leave tests, type declarations and other files out of the folder', () => {
      expect(transform(`const load = (type) => require(\`@shell/models/\${ type }\`);`).code).toContain('["@shell/models/**/*.{js,jsx,ts,tsx,mjs,vue,json}","!**/__tests__/**","!**/*.{test,spec}.*","!**/*.d.ts"]');
    });

    it('should leave a path that starts with an expression alone, and warn about it', () => {
      expect(transform(`const load = (dir) => require(\`\${ dir }/a\`);`)).toBeUndefined();
      expect(warn).toHaveBeenCalledWith(`${ ROOT }/pkg/thing/index.ts: require(\`\${ dir }/a\`) cannot be bundled, so it will throw when it runs: start its path with a folder`);
    });
  });

  describe('with a package', () => {
    const load = (code: string, module: unknown) => new Function('__rancher_require_0__', `${ transform(code).code.replace(/^import .*$/gm, '') }\nreturn load();`)(module); // eslint-disable-line no-new-func
    const cloneDeep = () => 'cloned';

    it('should give the module.exports of a CommonJS package', () => {
      expect(load(`function load() {\n  return require('lodash/cloneDeep');\n}`, { default: cloneDeep })).toStrictEqual(cloneDeep);
    });

    it('should give the namespace of a package with named exports', () => {
      const namespace = { load: cloneDeep, default: { load: cloneDeep } };

      expect(load(`function load() {\n  return require('js-yaml');\n}`, namespace)).toStrictEqual(namespace);
    });
  });

  describe('in a build', () => {
    let root: string;

    beforeEach(() => {
      root = fs.mkdtempSync(path.join(os.tmpdir(), 'rancher-require-'));
      ['icons/aws.svg', 'icons/gcp.svg', 'icons/__tests__/aws.test.ts', 'models/pod.js', 'models/policy.ts', 'models/management/index.js', 'models/pod.d.ts', 'models/notes.md'].forEach((file) => {
        fs.mkdirSync(path.dirname(path.join(root, 'pkg/thing', file)), { recursive: true });
        fs.writeFileSync(path.join(root, 'pkg/thing', file), '');
      });
    });

    afterEach(() => {
      fs.rmSync(root, { recursive: true, force: true });
    });

    const build = (code: string) => transform(code, `${ root }/pkg/thing/index.ts`, 'build', root);
    const run = (code: string) => {
      const required: string[] = [];
      const fakeRequire = (source: string) => {
        required.push(source);

        return {
          __esModule: true, default: `value of ${ source }`, source
        };
      };

      return { required, load: new Function('require', `${ build(code).code }\nreturn load;`)(fakeRequire) }; // eslint-disable-line no-new-func
    };

    it('should leave a required module to the bundler, which loads it when the call runs', () => {
      expect(build(`function load() {\n  return require('./thing');\n}`)).toBeUndefined();
    });

    it.each([
      ['an image', './logo.svg'],
      ['json', './package.json'],
    ])('should give the value of %s', (_, source) => {
      expect(build(`const value = require('${ source }');`).code).toContain(`const value = __rancher_require_value__(require('${ source }'));`);
    });

    it.each([
      ['a module', { __esModule: true, default: 'url' }, 'url'],
      ['json, which the bundler gives as it is', { default: 'a key', other: 1 }, { default: 'a key', other: 1 }],
    ])('should give the value of an asset that the bundler gives as %s', (_, module, expected) => {
      const load = new Function('require', `${ build('function load() {\n  return require(\'./logo.svg\');\n}').code }\nreturn load;`)(() => module); // eslint-disable-line no-new-func

      expect(load()).toStrictEqual(expected);
    });

    it('should require only the file a template names, when the call runs', () => {
      const { required, load } = run(`const load = (name) => require(\`./icons/\${ name }.svg\`);`);

      expect(required).toStrictEqual([]);
      expect(load('aws')).toStrictEqual('value of ./icons/aws.svg');
      expect(required).toStrictEqual(['./icons/aws.svg']);
    });

    it.each([
      ['pod', '@shell/models/pod.js'],
      ['policy', '@shell/models/policy.ts'],
      ['management', '@shell/models/management/index.js'],
    ])('should require the module %p names from a folder of modules', (type, file) => {
      fs.symlinkSync(`${ root }/pkg/thing`, `${ root }/pkg/thing/.shell`);

      const { load } = run(`function load(type) {\n  return require(\`@shell/models/\${ type }\`);\n}`);

      expect(load(type)).toStrictEqual({
        __esModule: true, default: `value of ${ file }`, source: file
      });
    });

    it('should leave tests, type declarations and other files out of a template', () => {
      const code = build(`const load = (name) => require(\`./icons/\${ name }\`);`).code;

      expect(code).not.toContain('__tests__');
      expect(() => run(`const load = (name) => require(\`./icons/\${ name }\`);`).load('__tests__/aws.test')).toThrow(expect.objectContaining({ code: 'MODULE_NOT_FOUND' }));
    });
  });
});
