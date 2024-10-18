const { isSuggest } = require('../config');

/* eslint-disable no-console */
/**
 * TS Updates
 * Files: tsconfig*.json
 *
 * Add information about TS issues, recommend @ts-nocheck as temporary solution
 */
const tsUpdates = (params) => {
  if (!isSuggest) {
    console.warn('TS checks are stricter and may require to be fixed manually.',
      'Use @ts-nocheck to give you time to fix them.',
      'Add exception to your ESLint config to avoid linting errors.');
  }
  // TODO: Add case
};

module.exports = tsUpdates;
