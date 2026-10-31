import fs from 'fs';
import os from 'os';
import path from 'path';
import { rancherShellDependencies, shellDependencies } from '@shell/vite/shell-dependencies.mjs';

const write = (root: string, files: Record<string, string>) => {
  Object.entries(files).forEach(([file, content]) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  });
};

const INSTALLED = ['node_modules/lodash/package.json', 'node_modules/@scope/lib/package.json', 'node_modules/vue/package.json', 'node_modules/buffer/package.json'];

describe('fx: shell-dependencies', () => {
  let root: string;
  let shellDir: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'rancher-shell-deps-'));
    shellDir = path.join(root, 'node_modules', '@rancher', 'shell');
    write(root, Object.fromEntries(INSTALLED.map((file) => [file, '{}'])));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  describe('shellDependencies', () => {
    it('should list the installed packages the shell imports', () => {
      write(shellDir, {
        'utils/a.js':       `import xor from 'lodash/xor';\nexport { thing } from '@scope/lib/thing';\n`,
        'components/B.vue': `<script>\nimport { ref } from 'vue';\nconst c = () => import('lodash');\n</script>`,
        'plugins/c.ts':     `import 'buffer';\n`,
        'models/d.mjs':     `import { e } from 'not-installed';\n`,
      });

      expect(shellDependencies(shellDir, root)).toStrictEqual(['@scope/lib/thing', 'buffer', 'lodash', 'lodash/xor', 'vue']);
    });

    it.each([
      ['a relative import', `import a from './a';`],
      ['a shell alias', `import a from '@shell/utils/a';`],
      ['a components alias', `import a from '@components/Form/A';`],
      ['a node builtin', `import fs from 'node:fs';`],
      ['a stylesheet', `import 'lodash/styles.css';`],
      ['an image', `import logo from 'lodash/logo.svg';`],
      ['a virtual module', `import a from 'virtual:thing';`],
      ['the shell itself', `import a from '@rancher/shell/utils/a';`],
    ])('should leave out %s', (_, code) => {
      write(shellDir, { 'utils/a.js': code });

      expect(shellDependencies(shellDir, root)).toStrictEqual([]);
    });

    it.each([
      ['a test', 'utils/__tests__/a.test.ts'],
      ['a spec beside the code', 'utils/a.spec.js'],
      ['type declarations', 'utils/a.d.ts'],
      ['build tooling', 'vite/a.mjs'],
      ['the shell configuration', 'vite.config.mjs'],
      ['the dev server', 'server/a.js'],
      ['package build scripts', 'pkg/a.js'],
    ])('should not read %s', (_, file) => {
      write(shellDir, { [file]: `import xor from 'lodash/xor';` });

      expect(shellDependencies(shellDir, root)).toStrictEqual([]);
    });
  });

  describe('rancherShellDependencies', () => {
    it('should pre-bundle the shell dependencies and serve the shell as source when the shell is installed', () => {
      write(shellDir, { 'utils/a.js': `import xor from 'lodash/xor';` });

      const config = (rancherShellDependencies({ root, shellDir }) as any).config();

      expect(config).toStrictEqual({ optimizeDeps: { include: ['lodash/xor'], exclude: ['@rancher/shell', '@shell', '~shell', '@components'] } });
    });

    it('should leave the configuration alone when the shell is part of the app', () => {
      write(root, { 'shell/utils/a.js': `import xor from 'lodash/xor';` });

      expect((rancherShellDependencies({ root, shellDir: path.join(root, 'shell') }) as any).config()).toBeUndefined();
    });
  });
});
