import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build:   {
    lib: {
      entry:    resolve(__dirname, 'src/index.ts'),
      name:     'RancherCodeMirror',
      formats:  ['es', 'umd'],
      fileName: (fmt) => `rancher-codemirror.${ fmt === 'es' ? 'js' : 'umd.cjs' }`
    },
    rollupOptions: {
      external: ['vue'],
      output:   { globals: { vue: 'Vue' } }
    }
  }
});
