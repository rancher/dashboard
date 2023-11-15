import { defineConfig } from 'cypress';
import { removeDirectory } from 'cypress-delete-downloads-folder';
// Required for env vars to be available in cypress
require('dotenv').config();

const skipSetup = process.env.TEST_SKIP_SETUP === 'true';
const hasCoverage = (process.env.TEST_INSTRUMENT === 'true') || false; // Add coverage if instrumented

/**
 * Filter test spec paths based on env var configuration
 * @returns
 */
const getSpecPattern = (): string[] => {
  const optionalPaths = [
    {
      path:   'cypress/e2e/tests/setup/**/*.spec.ts',
      active: !skipSetup
    }
  ];
  const activePaths = optionalPaths.filter(({ active }) => Boolean(active)).map(({ path }) => path);

  // List the test directories to be included
  const testDirs = ['pages', 'navigation', 'global-ui'].map((dir) => `cypress/e2e/tests/${ dir }/**/*.spec.ts`);

  return [
    ...activePaths,
    ...testDirs
  ];
};
const baseUrl = (process.env.TEST_BASE_URL || 'https://localhost:8005').replace(/\/$/, '');

// Default user name, if TEST_USERNAME is not provided
const DEFAULT_USERNAME = 'admin';

// Log summary of the environment variables that we have detected (or are going ot use) - we won't show any passwords
console.log('E2E Test Configuration'); // eslint-disable-line no-console
console.log(''); // eslint-disable-line no-console

if (process.env.TEST_USERNAME) {
  console.log(`    Username: ${ process.env.TEST_USERNAME }`); // eslint-disable-line no-console
} else {
  console.log(`    Username: ${ DEFAULT_USERNAME } (TEST_USERNAME not set, using default)`); // eslint-disable-line no-console
}

if (process.env.CATTLE_BOOTSTRAP_PASSWORD && process.env.TEST_PASSWORD) {
  console.log(' ❌ You should not set both CATTLE_BOOTSTRAP_PASSWORD and TEST_PASSWORD - CATTLE_BOOTSTRAP_PASSWORD will be used'); // eslint-disable-line no-console
}

if (!skipSetup && !process.env.CATTLE_BOOTSTRAP_PASSWORD) {
  console.log(' ❌ You must provide CATTLE_BOOTSTRAP_PASSWORD when running setup tests'); // eslint-disable-line no-console
}

if (!process.env.CATTLE_BOOTSTRAP_PASSWORD && !process.env.TEST_PASSWORD) {
  console.log(' ❌ You must provide one of CATTLE_BOOTSTRAP_PASSWORD or TEST_PASSWORD'); // eslint-disable-line no-console
}

if (skipSetup && !process.env.TEST_PASSWORD) {
  console.log(' ❌ You should provide TEST_PASSWORD when running the tests without the setup tests'); // eslint-disable-line no-console
}

if (skipSetup) {
  console.log(`    Setup tests will NOT be run`); // eslint-disable-line no-console
} else {
  console.log(`    Setup tests will be run`); // eslint-disable-line no-console
}

console.log(`    Dashboard URL: ${ baseUrl }`); // eslint-disable-line no-console

const apiUrl = process.env.API || (baseUrl.endsWith('/dashboard') ? baseUrl.split('/').slice(0, -1).join('/') : baseUrl);

console.log(`    Rancher API URL: ${ apiUrl }`); // eslint-disable-line no-console
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
    grepFilterSpecs: true,
    baseUrl,
    coverage:        hasCoverage,
    codeCoverage:    {
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
    username:          process.env.TEST_USERNAME || DEFAULT_USERNAME,
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
    specPattern:                  getSpecPattern(),
    baseUrl
  },
  videoCompression:    15,
  videoUploadOnPasses: false,
});
