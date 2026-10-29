import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { vueParenthesisedDefaultExport } from '../../shell/vite/vue-compat.mjs';
import { rancherLoaders } from '../../shell/vite/loaders.mjs';
import { shellClassFields } from '../../shell/vite/class-fields.mjs';
import { injectStyles } from '../../shell/vite/inject-styles.mjs';

const SHELL = path.resolve(import.meta.dirname, '..', '..', 'shell');
const NAME = '@rancher/components';
const FILES = { umd: `${ NAME }.umd.min.js`, cjs: `${ NAME }.common.js` };

/**
 * Builds the components as a library, `dist/@rancher/components.umd.min.js` and `dist/@rancher/components.common.js`,
 * with Vue as an external dependency (the `Vue` global for the UMD build) and the styles added to the page when the
 * library is loaded
 */
export default {
  plugins: [
    vueParenthesisedDefaultExport(),
    vue(),
    rancherLoaders(),
    injectStyles(),
  ],

  oxc: shellClassFields,

  resolve: {
    alias: [
      { find: '@shell', replacement: SHELL },
      { find: '@components', replacement: path.join(import.meta.dirname, 'src', 'components') },
      { find: '~', replacement: path.join(import.meta.dirname, 'src') },
      { find: '@', replacement: SHELL },
    ],
    extensions: ['.mjs', '.js', '.jsx', '.vue', '.json', '.tsx', '.ts', '.scss'],
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData:      `@use 'sass:math'; @import '${ SHELL }/assets/styles/base/_mixins.scss'; @import '${ SHELL }/assets/styles/base/_variables.scss'; `,
        silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
      },
    },
  },

  define: { 'process.env.NODE_ENV': JSON.stringify('production') },

  build: {
    outDir:       'dist',
    sourcemap:    true,
    cssCodeSplit: false,
    lib:          {
      entry:    path.join(import.meta.dirname, 'src', 'main.ts'),
      name:     NAME,
      formats:  ['umd', 'cjs'],
      fileName: (format) => FILES[format],
    },
    rolldownOptions: {
      external: ['vue'],
      output:   { globals: { vue: 'Vue' }, exports: 'named' },
    },
  },
};
