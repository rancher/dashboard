/* eslint-disable no-console */
import { defineConfig } from 'cypress';
import { removeDirectory } from 'cypress-delete-downloads-folder';
import { getSpecPattern } from '@/scripts/cypress';
// Required for env vars to be available in cypress
require('dotenv').config();

/**
 * VARIABLES
 */
const hasCoverage = (process.env.TEST_INSTRUMENT === 'true') || false; // Add coverage if instrumented
const testDirs = ['setup', 'pages', 'navigation', 'global-ui'];
const skipSetup = process.env.TEST_SKIP?.includes('setup');
const baseUrl = (process.env.TEST_BASE_URL || 'https://localhost:8005').replace(/\/$/, '');
const DEFAULT_USERNAME = 'admin';
const username = process.env.TEST_USERNAME || DEFAULT_USERNAME;
const apiUrl = process.env.API || (baseUrl.endsWith('/dashboard') ? baseUrl.split('/').slice(0, -1).join('/') : baseUrl);

/**
 * LOGS:
 * Summary of the environment variables that we have detected (or are going ot use)
 * We won't show any passwords
 */
console.log('E2E Test Configuration');
console.log('');
console.log(`    Username: ${ username }`);

if (!process.env.CATTLE_BOOTSTRAP_PASSWORD && !process.env.TEST_PASSWORD) {
  console.log(' ❌ You must provide either CATTLE_BOOTSTRAP_PASSWORD or TEST_PASSWORD');
}
if (process.env.CATTLE_BOOTSTRAP_PASSWORD && process.env.TEST_PASSWORD) {
  console.log(' ❗ If both CATTLE_BOOTSTRAP_PASSWORD and TEST_PASSWORD are provided, the first will be used');
}
if (!skipSetup && !process.env.CATTLE_BOOTSTRAP_PASSWORD) {
  console.log(' ❌ You must provide CATTLE_BOOTSTRAP_PASSWORD when running setup tests');
}
if (skipSetup && !process.env.TEST_PASSWORD) {
  console.log(' ❌ You must provide TEST_PASSWORD when running the tests without the setup tests');
}

console.log(`    Setup tests will ${ skipSetup ? 'NOT' : '' } be run`);
console.log(`    Dashboard URL: ${ baseUrl }`);
console.log(`    Rancher API URL: ${ apiUrl }`);

/**
 * CONFIGURATION
 */
export default defineConfig({
  projectId:             process.env.TEST_PROJECT_ID,
  defaultCommandTimeout: process.env.TEST_TIMEOUT ? +process.env.TEST_TIMEOUT : 60000,
  trashAssetsBeforeRuns: true,
  chromeWebSecurity:     false,
  retries:               {
    runMode:  2,
    openMode: 0
  },
  env: {
    grepFilterSpecs:  true,
    grepOmitFiltered: true,
    baseUrl,
    coverage:         hasCoverage,
    codeCoverage:     {
      exclude: [
        'cypress/**/*.*',
        '**/__tests__/**/*.*',
        '**/__mocks__/**/*.*',
        '**/shell/scripts/**/*.*',
        'docusaurus/**/*.*',
        'stories/**/*.*',
        'drone/**/*.*',
        '.nuxt/**/*.*',
        '.nuxt-prod/**/*.*',
      ],
      include: [
        'shell/**/*.{vue,ts,js}',
        'pkg/rancher-components/src/components/**/*.{vue,ts,js}',
      ]
    },
    api:               apiUrl,
    username,
    password:          process.env.CATTLE_BOOTSTRAP_PASSWORD || process.env.TEST_PASSWORD,
    bootstrapPassword: process.env.CATTLE_BOOTSTRAP_PASSWORD,
    grepTags:          process.env.GREP_TAGS
  },
  e2e: {
    fixturesFolder: 'cypress/e2e/blueprints',
    setupNodeEvents(on, config) {
      // For more info: https://docs.cypress.io/guides/tooling/code-coverage
      require('@cypress/code-coverage/task')(on, config);
      require('@cypress/grep/src/plugin')(config);
      // For more info: https://www.npmjs.com/package/cypress-delete-downloads-folder
      on('task', { removeDirectory });

      return config;
    },
    experimentalSessionAndOrigin: true,
    specPattern:                  getSpecPattern(testDirs, process.env),
    baseUrl
  },
  videoCompression:    15,
  videoUploadOnPasses: false,
});
