import config from './shell/nuxt.config';

export default config(__dirname, {
  // excludes: ['epinio'],
  excludes: ['fleet', 'example']
  // autoLoad: ['fleet', 'example']
});
