/* eslint-disable no-console */
const fs = require('fs');
const { createPatch } = require('diff');
const stats = require('../stats');
const {
  isDry, isSuggest, isVerbose, removePlaceholder
} = require('../config');

const diffOutput = [];

function printUsage() {
  console.log(`
Usage: node index.js [options]

Options:

  --dry                 Dry Run Mode: Run the script without making any changes to your files.
  --verbose             Verbose Output: Enable detailed logging.
  --suggest             Suggest Mode: Generate a 'suggested_changes.diff' file with proposed changes.
  --paths=<path>        Specify Paths: Limit migration to specific paths or files (accepts glob patterns).
  --ignore=<patterns>   Ignore Patterns: Exclude specific files or directories (accepts comma-separated glob patterns).
  --files               Output Modified Files: List all files modified during the migration.
  --log                 Generate Log File: Write detailed migration statistics to 'stats.json'.
  --help, -h            Display this help message and exit.
  `);
}

function writeContent(file, content, originalContent) {
  if (!isDry && !isSuggest) {
    fs.writeFileSync(file, content);
  } else if (isSuggest) {
    if (typeof originalContent === 'undefined') {
      originalContent = fs.readFileSync(file, 'utf8');
    }
    const diff = createPatch(file, originalContent, content, '', '', { context: 3 });

    if (diff.trim()) {
      diffOutput.push({ file, diff });
    }
  }
}

function printContent(...args) {
  if (isVerbose) {
    console.log(...args);
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setParams(params) {
  const args = process.argv.slice(2);
  const paramKeys = ['paths', 'ignore'];

  args.forEach((val) => {
    paramKeys.forEach((key) => {
      if (val.startsWith(`--${ key }=`)) {
        const value = val.split('=')[1];

        if (key === 'ignore') {
          params.ignorePatterns = value.split(',').map((pattern) => pattern.trim());
        } else {
          params[key] = value;
        }
      }
    });
  });

  // Add user-specified ignore patterns
  if (params.ignorePatterns.length > 0) {
    params.ignore = params.ignore.concat(params.ignorePatterns);
  }
}

function printLog() {
  if (process.argv.includes('--files')) {
    console.dir(stats, { compact: true });
  }

  const statsCount = Object.entries(stats).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: value.length,
    }),
    {}
  );

  console.table(statsCount);

  if (isSuggest && diffOutput.length > 0) {
    const diffFile = 'suggested_changes.diff';
    let diffContent = '';

    diffOutput.forEach(({ file, diff }) => {
      diffContent += `--- ${ file }\n+++ ${ file }\n${ diff }\n`;
    });

    fs.writeFileSync(diffFile, diffContent);
    console.log(`\nSuggested changes have been written to ${ diffFile }`);
  }

  if (process.argv.includes('--log')) {
    fs.writeFileSync('stats.json', JSON.stringify(stats, null, 2));
  }
}

function printCompletion() {
  if (!isSuggest || !isDry) {
    console.log('\nMigration completed.\n');
    console.log(`You will need to reinstall the dependencies, run the following command:\n\n\tyarn install\n`);
  }
}

function replaceCases(fileType, files, replacementCases, printText, params) {
  files.forEach((file) => {
    const originalContent = fs.readFileSync(file, 'utf8');
    let content = originalContent;
    const matchedCases = [];

    replacementCases.forEach(([pattern, replacement, notes]) => {
      let matches = false;

      if (typeof pattern === 'string') {
        const regex = new RegExp(escapeRegExp(pattern), 'g');

        if (regex.test(content)) {
          matches = true;

          // Exclude cases without replacement
          if (replacement) {
            // Remove discontinued functionalities which do not break
            content = content.replace(regex, replacement === removePlaceholder ? '' : replacement);
          }
        }
      } else if (pattern.test(content)) {
        matches = true;

        // Exclude cases without replacement
        if (replacement) {
          content = content.replace(pattern, replacement === removePlaceholder ? '' : replacement);
        }
      }

      if (matches) {
        matchedCases.push({
          pattern: pattern.toString(),
          replacement,
          notes,
        });
      }
    });

    if (matchedCases.length) {
      writeContent(file, content, originalContent);
      printContent(file, printText, matchedCases);
      stats[fileType].push(file);
      stats.total.push(file);
    }
  });
}

module.exports = {
  printUsage,
  writeContent,
  printContent,
  escapeRegExp,
  setParams,
  printLog,
  printCompletion,
  replaceCases
};
