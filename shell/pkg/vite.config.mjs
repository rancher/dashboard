import fs from 'node:fs';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { rancherDynamicModules } from '../vite/dynamic-modules.mjs';
import { rancherLoaders } from '../vite/loaders.mjs';
import { vueParenthesisedDefaultExport } from '../vite/vue-compat.mjs';
import { rancherRequireCompat } from '../vite/require-compat.mjs';
import { shellClassFields } from '../vite/class-fields.mjs';
import { INITIAL_CHUNK, loadChunksOnDemand } from './chunk-loader.mjs';
import { replaceShellModules } from './replace-shell-modules.mjs';

// These modules will be externalised and not included with the build of a package library
// This helps reduce the package size, but these dependencies must be provided by the hosting application
const EXTERNALS = {
  vue:       'Vue',
  jquery:    '$',
  jszip:     '__jszip',
  'js-yaml': '__jsyaml',
};

/**
 * Add the package's styles to the page when its script runs, rather than as a separate stylesheet, so that the
 * script is all Rancher has to load
 */
function injectStyles() {
  return {
    name:    'rancher:pkg-inject-styles',
    apply:   'build',
    enforce: 'post',

    generateBundle(options, bundle) {
      const styles = Object.values(bundle).filter((file) => file.type === 'asset' && file.fileName.endsWith('.css'));
      const entry = Object.values(bundle).find((file) => file.type === 'chunk' && file.isEntry);

      if (!styles.length || !entry) {
        return;
      }

      const css = styles.map((file) => file.source).join('\n');
      const inject = `(function(){if(typeof document!=='undefined'){var s=document.createElement('style');s.appendChild(document.createTextNode(${ JSON.stringify(css) }));document.head.appendChild(s);}})();\n`;
      const sourceMap = entry.code.lastIndexOf('//# sourceMappingURL=');

      styles.forEach((file) => delete bundle[file.fileName]);
      entry.code = sourceMap === -1 ? `${ entry.code }\n${ inject }` : `${ entry.code.slice(0, sourceMap) }${ inject }${ entry.code.slice(sourceMap) }`;
    },
  };
}

/**
 * Vite configuration that builds the UI package in the current directory as the script `<name>-<version>.umd.min.js`,
 * which sets `window['<name>-<version>']` to the module the package's index exports, as Rancher expects, and loads the
 * package's lazily imported code from beside it when it is used. The shell must be linked into the package's `.shell`
 * folder (shell/scripts/build-pkg.sh does this).
 *
 * The output folder and file name can be set with PKG_DIST and PKG_NAME, and PKG_FORMAT=umd leaves the script
 * unminified.
 */
export default function() {
  const dir = process.cwd();
  const maindir = path.resolve(dir, '..', '..');
  // The shell code must be sym-linked into the .shell folder
  const SHELL = path.join(dir, '.shell');
  let COMPONENTS_DIR = path.join(SHELL, 'rancher-components');

  const stat = fs.lstatSync(SHELL);

  // If @rancher/shell is a symlink, then use the components folder for it
  if (stat.isSymbolicLink() && !fs.existsSync(COMPONENTS_DIR)) {
    const REAL_SHELL = fs.realpathSync(SHELL);

    COMPONENTS_DIR = path.join(REAL_SHELL, '..', 'pkg', 'rancher-components', 'src', 'components');
  }

  if (fs.existsSync(path.join(maindir, 'shell'))) {
    COMPONENTS_DIR = path.join(maindir, 'pkg', 'rancher-components', 'src', 'components');
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const name = process.env.PKG_NAME || `${ pkg.name }-${ pkg.version }`;
  const minify = process.env.PKG_FORMAT !== 'umd';
  const entry = ['index.ts', 'index.js'].map((file) => path.join(dir, file)).find((file) => fs.existsSync(file));
  const fileName = `${ name }.umd${ minify ? '.min' : '' }.js`;
  const appEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('VUE_APP_')));

  return {
    root:      dir,
    publicDir: false,
    define:    {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env':          JSON.stringify({ ...appEnv, NODE_ENV: 'production', BASE_URL: '/' }),
      global:                 'globalThis',
    },
    oxc: shellClassFields,

    resolve: {
      alias: [
        { find: '@shell', replacement: SHELL },
        { find: '~shell', replacement: SHELL },
        { find: '~@shell', replacement: SHELL },
        // This should be udpated once we move to rancher-components as a dependency
        { find: '@components', replacement: COMPONENTS_DIR },
        { find: /^(\.\/)?node_modules\//, replacement: `${ path.join(maindir, 'node_modules') }/` },
        { find: '~pkg', replacement: dir },
        { find: '~assets', replacement: path.join(SHELL, 'assets') },
        { find: /^~(?=[@\w])/, replacement: '' },
        { find: '~', replacement: maindir },
      ],
      extensions:       ['.mjs', '.js', '.jsx', '.vue', '.json', '.tsx', '.ts', '.scss'],
      preserveSymlinks: false,
    },

    css: {
      preprocessorOptions: {
        scss: {
          additionalData:      `@use 'sass:math'; @import '${ SHELL }/assets/styles/base/_variables.scss'; @import '${ SHELL }/assets/styles/base/_functions.scss'; @import '${ SHELL }/assets/styles/base/_mixins.scss'; `,
          silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
        },
      },
    },

    plugins: [
      vueParenthesisedDefaultExport(),
      vue(),
      rancherRequireCompat({ root: maindir }),
      replaceShellModules(dir, import.meta.dirname),
      rancherDynamicModules({ root: maindir, includePkg: () => true }),
      rancherLoaders(),
      loadChunksOnDemand(name, fileName, EXTERNALS),
      injectStyles(),
    ],

    build: {
      outDir:       process.env.PKG_DIST || path.join(maindir, 'dist-pkg', name),
      emptyOutDir:  false,
      sourcemap:    true,
      cssCodeSplit: false,
      minify,
      lib:          {
        entry,
        formats:  ['cjs'],
        fileName: () => fileName,
      },
      rolldownOptions: {
        external:     Object.keys(EXTERNALS),
        transform:    { inject: { Buffer: ['buffer', 'Buffer'] } },
        experimental: { nativeMagicString: true },
        output:       {
          exports:        'named',
          chunkFileNames: `${ name }.umd${ minify ? '.min' : '' }.[name].[hash].js`,
          codeSplitting:  { groups: [{ name: INITIAL_CHUNK, tags: ['$initial'], test: (id) => id !== entry }] },
        },
      },
    },
  };
}
