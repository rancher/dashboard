import config from './shell/nuxt.config';

export default config(__dirname, {
  excludes: [...(process.env.EXCLUDES_PKG?.split(',') || ['epinio', 'rancher-comonents'])],
  // excludes: ['fleet', 'example']
  // autoLoad: ['fleet', 'example']
});
