import { rancherRequireCompat } from '@shell/vite/require-compat.mjs';

const ROOT = '/app';
const warn = jest.fn();
const transform = (code: string, id = `${ ROOT }/pkg/thing/index.ts`) => {
  const plugin: any = rancherRequireCompat({ root: ROOT });

  plugin.configResolved({ root: `${ ROOT }/pkg/thing`, resolve: { alias: [{ find: '@shell', replacement: `${ ROOT }/pkg/thing/.shell` }] } });

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
      const load = run(`const load = (name) => require(\`./icons/\${ name }.svg\`);`, { './icons/aws.svg': { default: 'aws.svg' } });

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
});
