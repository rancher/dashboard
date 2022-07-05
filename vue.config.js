const config = require('./shell/vue.config');

module.exports = config(__dirname, {
  excludes: ['epinio'],
  // excludes: ['fleet', 'example']
  // autoLoad: ['fleet', 'example']
});
