
const config = require('./shell/vue.config');

// Excludes the following plugins if there's no .env file.
let defaultExcludes = 'rancher-components, harvester';

if (process.env.RANCHER_ENV === 'harvester') {
  defaultExcludes = defaultExcludes.replace(', harvester', '');
}
const excludes = process.env.EXCLUDES_PKG || defaultExcludes;

module.exports = config(__dirname, {
  excludes: excludes.replace(/\s/g, '').split(','),
  // excludes: ['fleet', 'example']
});
