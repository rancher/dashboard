const fs = require('fs');
const glob = require('glob');
const semver = require('semver');
const stats = require('../stats');
const { printContent, writeContent } = require('../utils/content');
const { nodeRequirement, isDry, isSuggest } = require('../config');

/**
 * NVM updates
 * Files: .nvmrc
 *
 * Verify presence of .nvmrc, create one if none, update if any
 */
const nvmUpdates = (params) => {
  const files = glob.sync(params.paths || '**/.nvmrc', { ignore: params.ignore });
  const nvmRequirement = 20;

  if (files.length === 0) {
    // If no .nvmrc files found, create one
    const newFilePath = '.nvmrc';

    if (!isDry && !isSuggest) {
      fs.writeFileSync(newFilePath, nvmRequirement.toString());
      printContent(newFilePath, `Created ${ newFilePath } with Node version ${ nvmRequirement }`, '');
    }

    writeContent(newFilePath, nvmRequirement.toString(), '');
    stats.nvmrc.push(newFilePath);
    stats.total.push(newFilePath);
  }

  files.forEach((file) => {
    if (file) {
      const originalContent = fs.readFileSync(file, 'utf8');
      let content = originalContent;
      const nodeVersionMatch = content.match(/([0-9.x]+)/g);
      const nodeVersion = semver.coerce(nodeVersionMatch[0]);

      // Ensure node version is up to date
      if (nodeVersion && semver.lt(nodeVersion, semver.coerce(nodeRequirement))) {
        printContent(file, `Updating node ${ [nodeVersionMatch[0], nvmRequirement] }`);
        content = content.replaceAll(nodeVersionMatch[0], nvmRequirement);
        writeContent(file, content, originalContent);
        stats.nvmrc.push(file);
        stats.total.push(file);
      }
    }
  });
};

module.exports = nvmUpdates;
