import fs from 'fs';
import os from 'os';
import path from 'path';
import { autoImportModule, dynamicModule, rancherDynamicModules } from '@shell/vite/dynamic-modules.mjs';

const write = (root: string, files: Record<string, string>) => {
  Object.entries(files).forEach(([file, content]) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  });
};

describe('fx: dynamic-modules', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'rancher-dynamic-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  describe('autoImportModule', () => {
    const FILES = ['/pkg/thing/edit/thing.vue', '/pkg/thing/detail/nested/index.vue', '/pkg/thing/models/management/thing.ts', '/pkg/thing/l10n/en-us.yaml', '/pkg/thing/other/thing.vue'];
    const PATTERNS = ['**/*.{vue,js,jsx,ts,tsx,yaml,yml}', '!**/__tests__/**', '!**/*.{test,spec}.{js,ts}', '!**/*.d.ts'];

    const importTypes = (pkgDir: string, root: string) => {
      const registered: [string, string, unknown][] = [];
      const globs: [string[], object][] = [];
      const glob = (patterns: string[], options: { eager?: boolean } = {}) => {
        globs.push([patterns, options]);

        return Object.fromEntries(FILES
          .filter((file) => file.startsWith(patterns[0].slice(0, patterns[0].indexOf('**'))))
          .map((file) => [file, options.eager ? { file } : () => file]));
      };
      const source = autoImportModule(pkgDir, root).replace(/import\.meta\.glob\(/g, 'glob(').replace('export function importTypes', 'return function importTypes');

      new Function('glob', source)(glob)({ register: (type: string, name: string, value: unknown) => registered.push([type, name, value]) }); // eslint-disable-line no-new-func

      return { registered, globs };
    };

    it('should register each type of the package by its path in the type folder', () => {
      expect(importTypes('/app/pkg/thing', '/app').registered.map(([type, name]) => [type, name])).toStrictEqual([
        ['detail', 'nested/index'],
        ['edit', 'thing'],
        ['models', 'management/thing'],
        ['l10n', 'en-us'],
      ]);
    });

    it('should import models up front, and the other types when they are used', () => {
      const registered = Object.fromEntries(importTypes('/app/pkg/thing', '/app').registered.map(([type, , value]) => [type, value]));

      expect((registered.models as () => unknown)()).toStrictEqual({ file: '/pkg/thing/models/management/thing.ts' });
      expect((registered.edit as () => unknown)()).toStrictEqual('/pkg/thing/edit/thing.vue');
    });

    it.each([
      ['of a package in an app', '/app', '/pkg/thing/edit/', {}],
      ['of a package built on its own', '/app/pkg/thing', '/edit/', {}],
      ['of models, eagerly', '/app', '/pkg/thing/models/', { eager: true }],
    ])('should glob the type folders %s from the root, leaving out tests and type declarations', (_, root, folder, options) => {
      const [first, ...exclusions] = PATTERNS;

      expect(importTypes('/app/pkg/thing', root).globs).toContainEqual([[`${ folder }${ first }`, ...exclusions], options]);
    });
  });

  describe('rancherDynamicModules', () => {
    const plugin: any = rancherDynamicModules({ root: '/app', includePkg: () => true });
    const resolveId = (source: string, importer: string) => plugin.resolveId.call({ resolve: async(target: string) => target }, source, importer);

    it.each([
      ['@pkg/utils/x', '/app/pkg/foo/edit/a.vue', '/app/pkg/foo/utils/x'],
      ['@pkg/foo/utils/x', '/app/pkg/foo/edit/a.vue', '/app/pkg/foo/utils/x'],
      ['@pkg/bar/utils/x', '/app/shell/a.js', '/app/pkg/bar/utils/x'],
    ])('should resolve %p from %p to %p', async(source, importer, expected) => {
      expect(await resolveId(source, importer)).toStrictEqual(expected);
    });
  });

  describe('dynamicModule', () => {
    it('should register the packages built into the app and load the UI packages it depends on', () => {
      write(root, {
        'package.json':                     JSON.stringify({ dependencies: { 'ui-pkg': '1.0.0', other: '1.0.0' } }),
        'node_modules/ui-pkg/package.json': JSON.stringify({
          name: 'ui-pkg', version: '1.0.0', main: 'ui-pkg-1.0.0.umd.min.js', rancher: {}
        }),
        'node_modules/other/package.json':   JSON.stringify({ name: 'other', version: '1.0.0' }),
        'pkg/builtin/package.json':          JSON.stringify({ rancher: {} }),
        'pkg/excluded/package.json':         JSON.stringify({ rancher: {} }),
        'pkg/not-an-extension/package.json': JSON.stringify({}),
        'pkg/no-package-json/index.ts':      '',
        'pkg/.hidden/package.json':          JSON.stringify({ rancher: {} }),
      });

      const source = dynamicModule(root, (name: string) => name !== 'excluded');

      expect(source.split('\n').filter((line) => line.trim().startsWith('$extension.') || line.startsWith('import'))).toStrictEqual([
        `import * as builtin0 from ${ JSON.stringify(path.join(root, 'pkg/builtin')) };`,
        '  $extension.registerBuiltinExtension("builtin", builtin0);',
        '  $extension.loadAsync("ui-pkg-1.0.0", "/pkg/ui-pkg-1.0.0/ui-pkg-1.0.0.umd.min.js");',
      ]);
    });
  });
});
