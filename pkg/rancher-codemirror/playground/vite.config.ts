import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@rancher/codemirror': resolve(__dirname, '../src/index.ts'),
      '~shell':              resolve(__dirname, '../../../shell')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Allow @import 'base/functions', 'themes/modern', etc. without prefix
        loadPaths:    [resolve(__dirname, '../../../shell/assets/styles')],
        // Suppress deprecation warnings originating from the dashboard's theme files
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'abs-percent', 'if-function']
      }
    }
  }
});
