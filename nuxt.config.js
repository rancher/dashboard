import config from './shell/nuxt.config';

// Excludes the following plugins if there's no .env file.
const excludes = process.env.EXCLUDES_PKG || 'epinio, rancher-components';

export default config(__dirname, {
  excludes:  excludes.replace(/\s/g, '').split(','),
  useEslint: false
  // excludes: ['fleet', 'example']
  // autoLoad: ['fleet', 'example']
});
