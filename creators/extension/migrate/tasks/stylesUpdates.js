const glob = require('glob');
const { replaceCases } = require('../utils/content');

/**
 * Update styles (e.g., replace ::v-deep with :deep)
 */
const stylesUpdates = (params) => {
  const files = glob.sync(params.paths || '**/*.{vue,scss,css}', { ignore: params.ignore });
  const cases = [
    // Replace '::v-deep' without parentheses with ':deep()'
    [/::v-deep(?!\()/g, ':deep()', 'Replace ::v-deep with :deep()'],
    // Replace '::v-deep(' with ':deep('
    [/::v-deep\(/g, ':deep(', 'Replace ::v-deep( with :deep('],
  ];

  replaceCases('style', files, cases, `Updating styles`);
};

module.exports = stylesUpdates;
