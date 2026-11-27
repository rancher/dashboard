import config from './shell/vite.config.mjs';

// Excludes the following plugins if there's no .env file.
let defaultExcludes = 'rancher-components, harvester';

if (process.env.RANCHER_ENV === 'harvester') {
  defaultExcludes = defaultExcludes.replace(', harvester', '');
}
const excludes = process.env.EXCLUDES_PKG || defaultExcludes;

export default config(import.meta.dirname, {
  excludes: excludes.replace(/\s/g, '').split(','),
  // excludes: ['fleet', 'example']
});
