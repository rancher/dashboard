import fs from 'fs';
import os from 'os';
import path from 'path';
import viteUpdates from '../tasks/viteUpdates';

const APP_VUE_CONFIG = `const config = require('@rancher/shell/vue.config'); // eslint-disable-line @typescript-eslint/no-var-requires

module.exports = config(__dirname, {
  excludes: ['fleet'],
  // excludes: ['fleet', 'example']
});
`;

const write = (files: Record<string, string>) => Object.entries(files).forEach(([file, content]) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
});

const read = (file: string) => fs.readFileSync(file, 'utf8');

describe('fx: viteUpdates', () => {
  const cwd = process.cwd();
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rancher-migrate-'));
    process.chdir(dir);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(cwd);
    fs.rmSync(dir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('should run the app with vite', () => {
    write({
      'package.json': JSON.stringify({
        scripts: {
          dev: 'NODE_ENV=dev ./node_modules/.bin/vue-cli-service serve', build: './node_modules/.bin/vue-cli-service build', clean: './clean'
        }
      })
    });

    viteUpdates();

    expect(JSON.parse(read('package.json')).scripts).toStrictEqual({
      dev: 'NODE_ENV=dev ./node_modules/.bin/vite', build: './node_modules/.bin/vite build', clean: './clean'
    });
  });

  it('should raise @rancher/shell to the given version when it is older', () => {
    write({ 'package.json': JSON.stringify({ dependencies: { '@rancher/shell': '^3.0.14' } }) });

    viteUpdates({ shellVersion: '3.0.15' });

    expect(JSON.parse(read('package.json')).dependencies).toStrictEqual({ '@rancher/shell': '3.0.15' });
  });

  it.each([
    ['a newer shell', '^3.0.16', '3.0.15'],
    ['a shell that is not a version', 'file:../shell', '3.0.15'],
    ['the shell when no version is given', '^3.0.14', undefined],
  ])('should keep %s', (_, shell, shellVersion) => {
    write({ 'package.json': JSON.stringify({ dependencies: { '@rancher/shell': shell } }) });

    viteUpdates({ shellVersion });

    expect(JSON.parse(read('package.json')).dependencies).toStrictEqual({ '@rancher/shell': shell });
  });

  it('should replace the generated vue.config.js with a vite.config.mjs that keeps its excludes', () => {
    write({ 'vue.config.js': APP_VUE_CONFIG });

    viteUpdates();

    expect(fs.existsSync('vue.config.js')).toStrictEqual(false);
    expect(read('vite.config.mjs')).toContain('excludes: [\'fleet\'],');
  });

  it('should remove the generated vue.config.js and keep the vite.config.mjs there is already', () => {
    write({ 'vue.config.js': APP_VUE_CONFIG, 'vite.config.mjs': 'export default {};\n' });

    viteUpdates();

    expect(fs.existsSync('vue.config.js')).toStrictEqual(false);
    expect(read('vite.config.mjs')).toStrictEqual('export default {};\n');
  });

  it('should keep a customized vue.config.js and say it is no longer used', () => {
    write({ 'vue.config.js': `${ APP_VUE_CONFIG }module.exports.devServer = {};\n` });

    viteUpdates();

    expect(fs.existsSync('vue.config.js')).toStrictEqual(true);
    expect(read('vite.config.mjs')).toContain('excludes: [],');
    expect(console.warn).toHaveBeenCalledWith('vue.config.js has been customized and is no longer used: move its configuration to vite.config.mjs'); // eslint-disable-line no-console
  });

  it('should remove what packages only needed for Vue CLI', () => {
    write({
      'pkg/thing/package.json':    JSON.stringify({ name: 'thing', devDependencies: { '@vue/cli-service': '5.0.8', '@vue/cli-plugin-babel': '5.0.8' } }),
      'pkg/thing/tsconfig.json':   '{\n  // comments and trailing commas are allowed\n  "compilerOptions": {\n    "types": [\n      "node",\n      "webpack-env",\n      "shell",\n    ],\n  },\n}\n',
      'pkg/thing/vue.config.js':   'module.exports = require(\'./.shell/pkg/vue.config\')(__dirname);\n',
      'pkg/thing/babel.config.js': 'module.exports = require(\'./.shell/pkg/babel.config.js\');\n',
    });

    viteUpdates();

    expect(JSON.parse(read('pkg/thing/package.json'))).toStrictEqual({ name: 'thing' });
    expect(read('pkg/thing/tsconfig.json')).toStrictEqual('{\n  // comments and trailing commas are allowed\n  "compilerOptions": {\n    "types": [\n      "node",\n      "shell",\n    ],\n  },\n}\n');
    expect(fs.readdirSync('pkg/thing').sort()).toStrictEqual(['package.json', 'tsconfig.json']);
  });

  it.each([
    ['the package\'s .shell link', 'module.exports = require(\'./.shell/pkg/vue.config.js\')(__dirname);\n'],
    ['@rancher/shell', 'module.exports = require(\'@rancher/shell/pkg/vue.config\')(__dirname);\n'],
  ])('should remove a package vue.config.js that only uses the shell\'s, through %s', (_, content) => {
    write({ 'pkg/thing/vue.config.js': content });

    viteUpdates();

    expect(fs.existsSync('pkg/thing/vue.config.js')).toStrictEqual(false);
  });

  it('should keep a customized package vue.config.js and say it is no longer used', () => {
    write({ 'pkg/thing/vue.config.js': 'module.exports = () => ({});\n' });

    viteUpdates();

    expect(fs.existsSync('pkg/thing/vue.config.js')).toStrictEqual(true);
    expect(console.warn).toHaveBeenCalledWith(`${ path.join('pkg', 'thing', 'vue.config.js') } has been customized and is no longer used: move its configuration to ${ path.join('pkg', 'thing', 'vite.config.mjs') }`); // eslint-disable-line no-console
  });
});
