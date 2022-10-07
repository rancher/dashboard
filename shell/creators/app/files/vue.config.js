/**
 * This file is here purely to support using the typescript version of the vue config vue.config.ts.
 */
require('ts-node').register({
  project:         './tsconfig.json',
  compilerOptions: { module: 'commonjs' },
  logError:        true
});

module.exports = require('./vue.config.ts').default;
