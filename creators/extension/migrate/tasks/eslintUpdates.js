const glob = require('glob');
const fs = require('fs');
const path = require('path');
const stats = require('../stats');
const { writeContent, printContent } = require('../utils/content');

/**
 * ESLint Updates
 * Files: .eslintrc.js, .eslintrc.json, .eslintrc.yml
 */
const eslintUpdates = (params) => {
  const files = glob.sync(params.paths || '**/.eslintrc.*{js,json,yml}', { ignore: params.ignore });
  const replacePlugins = [
    ['plugin:vue/essential', 'plugin:vue/vue3-essential'],
    ['plugin:vue/strongly-recommended', 'plugin:vue/vue3-strongly-recommended'],
    ['plugin:vue/recommended', 'plugin:vue/vue3-recommended']
  ];
  const newRules = {
    'vue/one-component-per-file':       'off',
    'vue/no-deprecated-slot-attribute': 'off',
    'vue/require-explicit-emits':       'off',
    'vue/v-on-event-hyphenation':       'off',
  };

  files.forEach((file) => {
    const originalContent = fs.readFileSync(file, 'utf8');
    let content = originalContent;
    const matchedCases = [];

    replacePlugins.forEach(([text, replacement]) => {
      if (content.includes(text)) {
        content = content.replaceAll(text, replacement);
        matchedCases.push([text, replacement]);

        writeContent(file, content, originalContent);
      }
    });

    const eslintConfigPath = path.join(process.cwd(), `${ file }`);
    let eslintConfig;

    try {
      eslintConfig = require(eslintConfigPath);
    } catch (error) {
      eslintConfig = {};
    }

    if (!eslintConfig.rules) {
      eslintConfig.rules = {};
    }

    Object.keys(newRules).forEach((rule) => {
      if (!eslintConfig.rules[rule]) {
        eslintConfig.rules[rule] = newRules[rule];
        matchedCases.push(rule);
      }
    });

    if (matchedCases.length) {
      const updatedConfig = `module.exports = ${ JSON.stringify(eslintConfig, null, 2) }`;

      writeContent(file, updatedConfig, originalContent);
      printContent(file, `Updating ESLint`, matchedCases);
      stats.eslint.push(file);
      stats.total.push(file);
    }
  });
};

module.exports = eslintUpdates;
