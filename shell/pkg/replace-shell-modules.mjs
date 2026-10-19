import fs from 'node:fs';
import path from 'node:path';
import sharedCodeMirror from './shared-codemirror.js';

const SHARED_CODEMIRROR = '\0@rancher/shared-codemirror/';
const STEVE_WORKER = /\/plugins\/steve\/worker\/web-worker\.(basic|advanced)\.js\?worker&inline$/;

/**
 * Builds a package with stubs in place of the shell modules that would otherwise bundle large parts of the shell again
 * (the dynamic importer, the model loader, the asset lookups and the Steve web workers), the host's vue-router, and the
 * host's CodeMirror packages where it has them.
 *
 * @param {string} dir the package's folder; its own `model-loader-require.lib.js`, if it has one, replaces the shell's
 * @param {string} stubDir the folder of the stubs (shell/pkg)
 */
export function replaceShellModules(dir, stubDir) {
  const ownModelLoader = path.join(dir, 'model-loader-require.lib.js');
  const stubs = {
    'dynamic-importer':     path.join(stubDir, 'dynamic-importer.lib.js'),
    'model-loader-require': fs.existsSync(ownModelLoader) ? ownModelLoader : path.join(stubDir, 'model-loader-require.lib.js'),
    'require-asset':        path.join(stubDir, 'require-asset.lib.js'),
  };
  const vueRouter = path.join(stubDir, 'vue-router.lib.js');

  return {
    name:    'rancher:pkg-replace-shell-modules',
    enforce: 'pre',

    resolveId(source, importer = '') {
      const stub = Object.keys(stubs).find((name) => source === name || source.endsWith(`/${ name }`));

      if (stub) {
        return stubs[stub];
      }

      if (STEVE_WORKER.test(source)) {
        return path.join(stubDir, 'steve-worker.lib.js');
      }

      if (source === 'vue-router' && importer !== vueRouter) {
        return vueRouter;
      }

      const codeMirror = sharedCodeMirror.replacementFor(source, importer);

      if (codeMirror) {
        return `${ SHARED_CODEMIRROR }${ source }`;
      }
    },

    load(id) {
      if (id.startsWith(SHARED_CODEMIRROR)) {
        return sharedCodeMirror.stubSource(id.slice(SHARED_CODEMIRROR.length));
      }
    },
  };
}
