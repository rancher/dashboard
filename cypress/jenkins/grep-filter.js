/**
 * Pre-filter script for @cypress/grep tag matching.
 *
 * Resolves spec files from testDirs glob patterns, AST-parses each file
 * for tags using find-test-names, then applies the same shouldTestRun
 * logic that @cypress/grep uses internally.
 *
 * Outputs a comma-separated list of matching spec file paths (relative)
 * to stdout. If no grepTags are set or no specs match, outputs nothing.
 *
 * Usage:
 *   CYPRESS_grepTags="@onlyThis" node cypress/jenkins/grep-filter.js
 */

/* eslint-disable no-console */
const globby = require('globby');
const fs = require('fs');
const path = require('path');
const { getTestNames } = require('find-test-names');
const { parseGrep, shouldTestRun } = require('@cypress/grep/src/utils');

const grepTags = process.env.CYPRESS_grepTags || process.env.GREP_TAGS;

if (!grepTags) {
  // No tags specified — run all specs (output nothing so cypress.sh skips --spec)
  process.exit(0);
}

const testDirs = [
  'cypress/e2e/tests/priority/**/*.spec.ts',
  'cypress/e2e/tests/components/**/*.spec.ts',
  'cypress/e2e/tests/setup/**/*.spec.ts',
  'cypress/e2e/tests/pages/**/*.spec.ts',
  'cypress/e2e/tests/navigation/**/*.spec.ts',
  'cypress/e2e/tests/global-ui/**/*.spec.ts',
  'cypress/e2e/tests/features/**/*.spec.ts',
  'cypress/e2e/tests/extensions/**/*.spec.ts'
];

const cwd = process.cwd();

const specFiles = globby.sync(testDirs, {
  cwd,
  ignore:   ['*.hot-update.js'],
  absolute: true,
});

const parsedGrep = parseGrep(null, grepTags);

const matched = specFiles.filter((specFile) => {
  try {
    const text = fs.readFileSync(specFile, { encoding: 'utf8' });
    const testInfo = getTestNames(text);

    return testInfo.tests.some((info) => shouldTestRun(parsedGrep, null, info.tags));
  } catch (err) {
    // If we can't parse it, include it so Cypress can handle it at runtime
    console.error('grep-filter: could not parse %s — including it', specFile);

    return true;
  }
});

if (matched.length === 0) {
  console.error('grep-filter: no specs matched tag(s) "%s"', grepTags);
  process.exit(0);
}

console.error('grep-filter: matched %d spec(s) for tag(s) "%s"', matched.length, grepTags);

// Output relative paths, comma-separated (Cypress --spec format)
const relativePaths = matched.map((p) => path.relative(cwd, p));

process.stdout.write(relativePaths.join(','));
