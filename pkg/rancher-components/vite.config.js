import path from 'path'
import { defineConfig } from 'vite'
import vue2 from '@vitejs/plugin-vue2'

export default defineConfig({
  build: {
    lib: {
     entry: path.resolve(__dirname, 'src/main.ts'),
      name: '@rancher/components',
      fileName: (format) => `@rancher/components.${format}.js`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // Add external deps here
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  plugins: [
    vue2(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "../../shell/assets/styles/base/_mixins.scss";
          @import "../../shell/assets/styles/base/_variables.scss";
        `,
      },
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
      '@': path.resolve(__dirname, '../../shell/'),
      '@shell': path.resolve(__dirname, '../../shell/'),
      '@components': path.resolve(__dirname, 'src/components'),
    }
  }
})
