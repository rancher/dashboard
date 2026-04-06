/**
 * Minimal webpack resolve config for eslint-import-resolver-webpack.
 *
 * The actual build uses Vite (see shell/vite.config.js).
 * This file only exists so that ESLint's import plugin can resolve
 * aliased paths like @shell/, @components/, etc.
 */
const path = require('path');

const dir = __dirname;
const shellDir = path.join(dir, 'shell');
const componentsDir = path.join(dir, 'pkg', 'rancher-components', 'src', 'components');

module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
        '@shell':      shellDir,
        '~shell':      shellDir,
        '@components': componentsDir,
        '@pkg':        path.join(dir, 'pkg'),
        '~assets':     path.join(shellDir, 'assets'),
        '~':           dir,
        '@':           dir,
      },
      extensions: ['.tsx', '.ts', '.js', '.vue', '.scss', '.json'],
    }
  }
};
