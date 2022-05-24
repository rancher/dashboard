import config from './shell/nuxt.config';

export default config(__dirname, {
  excludes: ['epinio', 'rancher-components'],
  // excludes: ['fleet', 'example']
  // autoLoad: ['fleet', 'example']
});
