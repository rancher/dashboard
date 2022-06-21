import config from './shell/nuxt.config';

// Excludes the following plugins if there's no .env file.
const excludes = process.env.EXCLUDES_PKG || 'epinio, rancher-components, harvester';

export default config(__dirname, {
  excludes: excludes.replace(/\s/g, '').split(','),
  // excludes: ['fleet', 'example']
  // autoLoad: ['fleet', 'example']
});
