import config from './shell/nuxt.config';

// Excludes the following plugins if there's no .env file.
let defaultExcludes = 'epinio, rancher-components, harvester';

if (process.env.RANCHER_ENV === 'harvester') {
  defaultExcludes = defaultExcludes.replace(', harvester', '');
}
const excludes = process.env.EXCLUDES_PKG || defaultExcludes;

export default config(__dirname, {
  excludes: excludes.replace(/\s/g, '').split(','),
  // excludes: ['fleet', 'example']
  // autoLoad: ['fleet', 'example']
});
