import config from '@rancher/shell/vite.config.mjs';

export default config(import.meta.dirname, {
  excludes: [],
  // excludes: ['fleet', 'example']
});
