import config from './shell/nuxt.config';

export default config(__dirname, {
  excludes: ['epinio', 'elemental'],
  // excludes: ['fleet', 'example']
  // autoLoad: ['fleet', 'example']
});
