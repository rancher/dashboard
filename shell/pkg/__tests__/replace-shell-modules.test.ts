import fs from 'fs';
import os from 'os';
import path from 'path';
import { replaceShellModules } from '@shell/pkg/replace-shell-modules.mjs';

const STUBS = '/app/node_modules/@rancher/shell/pkg';

describe('fx: replaceShellModules', () => {
  const plugin: any = replaceShellModules('/app/pkg/foo', STUBS);

  it.each([
    ['@shell/utils/dynamic-importer', 'dynamic-importer.lib.js'],
    ['@shell/plugins/dashboard-store/model-loader-require', 'model-loader-require.lib.js'],
    ['@shell/utils/require-asset', 'require-asset.lib.js'],
    ['vue-router', 'vue-router.lib.js'],
    ['@shell/plugins/steve/worker/web-worker.basic.js?worker&inline', 'steve-worker.lib.js'],
    ['/app/pkg/foo/.shell/plugins/steve/worker/web-worker.advanced.js?worker&inline', 'steve-worker.lib.js'],
  ])('should build %p from the shell stub', (source, stub) => {
    expect(plugin.resolveId(source, '/app/pkg/foo/index.ts')).toStrictEqual(path.join(STUBS, stub));
  });

  it('should leave the stub vue-router its own import of vue-router', () => {
    expect(plugin.resolveId('vue-router', path.join(STUBS, 'vue-router.lib.js'))).toBeUndefined();
  });

  it('should build a shared CodeMirror package from a stub', () => {
    expect(plugin.resolveId('@codemirror/view', '/app/pkg/foo/index.ts')).toStrictEqual('\0@rancher/shared-codemirror/@codemirror/view');
  });

  it('should leave other modules to the build', () => {
    expect(plugin.resolveId('@shell/models/pod', '/app/pkg/foo/index.ts')).toBeUndefined();
  });

  it('should use the model loader of a package that has its own', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rancher-pkg-'));

    fs.writeFileSync(path.join(dir, 'model-loader-require.lib.js'), '');

    try {
      expect((replaceShellModules(dir, STUBS) as any).resolveId('@shell/plugins/dashboard-store/model-loader-require')).toStrictEqual(path.join(dir, 'model-loader-require.lib.js'));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
