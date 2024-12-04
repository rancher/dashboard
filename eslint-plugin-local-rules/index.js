/**
 * This file is included as a package.json file devDependency using a local file link which looks like `"eslint-plugin-local-rules": "link:./eslint-plugin-local-rules"`.
 *
 * We're creating and loading custom rules in this way because it was the best way that I found eslint supports custom local rules without having to add another library.
 * - Unfortunately `--rulesdir` cli flag is deprecated and didn't make the rules available to our editors.
 * - Eslint by default searches through your packages to find the specified plugin. This meant we needed a way to create a package locally and this was accomplished with the above local dependency.
 * - We called this local dependency `eslint-plugin-local-rules` because if you specify `local-rules` as the plugin you'd like eslint to load it will by default lookup
 *   `eslint-plugin-local-rules`. This is just a naming convention that eslint uses.
 * - None of these concepts appear to be well documented around package.json or eslint.
 */

const vCleanTooltip = require('./v-clean-tooltip');

module.exports = {
  configs: { all: { rules: { 'local-rules/v-clean-tooltip': 'error' } } },
  rules:   { 'v-clean-tooltip': vCleanTooltip }
};
