import { defineConfig } from 'cypress';
require('dotenv').config();

/**
 * Filter test spec paths based on env var configuration
 * @returns
 */
const getSpecPattern = (): string[] => {
  const optionalPaths = [
    {
      path:   'cypress/e2e/tests/setup/**/*.spec.ts',
      active: process.env.TEST_SKIP_SETUP !== 'true'
    }
  ];
  const activePaths = optionalPaths.filter(({ active }) => Boolean(active)).map(({ path }) => path);

  return [
    ...activePaths,
    'cypress/e2e/tests/pages/**/*.spec.ts',
    'cypress/e2e/tests/navigation/**/*.spec.ts'
  ];
};
const baseUrl = (process.env.TEST_BASE_URL || 'https://localhost:8005').replace(/\/$/, '');

export default defineConfig({
  projectId:             process.env.TEST_PROJECT_ID,
  defaultCommandTimeout: 60000,
  trashAssetsBeforeRuns: true,
  env:                   {
    baseUrl,
    username:          process.env.TEST_USERNAME,
    password:          process.env.TEST_PASSWORD,
    bootstrapPassword: process.env.CATTLE_BOOTSTRAP_PASSWORD,
  },
  e2e:                   {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.ts')(on, config);
    },
    experimentalSessionAndOrigin: true,
    specPattern:                  getSpecPattern(),
    baseUrl
  },
});
