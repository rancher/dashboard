const fs = require('fs');
const glob = require('glob');
const stats = require('../stats');
const { writeContent } = require('../utils/content');

/**
 * Vue config update
 * Files: vue.config.js
 *
 * Verify vue.config presence of deprecated Webpack5 options
 * - devServer.public: 'path' -> client: { webSocketURL: 'path' }
 */
const vueConfigUpdates = (params) => {
  const files = glob.sync(params.paths || 'vue.config**.js', { ignore: params.ignore });

  files.forEach((file) => {
    const originalContent = fs.readFileSync(file, 'utf8');
    const content = originalContent;

    // Verify vue.config presence of deprecated Webpack5 options
    if (content.includes('devServer.public: \'path\'')) {
      writeContent(file, content, originalContent);
      stats.webpack.push(file);
      stats.total.push(file);
      // TODO: Add replacement
    }
  });
};

module.exports = vueConfigUpdates;
