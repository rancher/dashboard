require('ts-node').register({
  project:         './tsconfig.json',
  compilerOptions: { module: 'commonjs' },
  logError:        true
});

module.exports = require('./vue.config.ts').default;
