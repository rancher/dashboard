import config from './shell/nuxt.config';

export default config(__dirname, {
  excludes: ['rancher-components'],
  // excludes: ['fleet', 'example']
  // autoLoad: ['fleet', 'example']
});
