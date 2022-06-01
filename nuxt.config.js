import config from './shell/nuxt.config';

export default config(__dirname, {
  excludes: [...process.env.EXCLUDES_PKG.split(',')],
  // excludes: ['fleet', 'example']
  // autoLoad: ['fleet', 'example']
});
