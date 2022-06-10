import { defineConfig } from 'cypress';

/**
 * Filter test spec paths based on env var configuration
 * @returns
 */
const getSpecPattern = (): string => {
  const optionalPaths = [
    {
      path:   'e2e/tests/setup/**/*.spec.ts',
      active: process.env.TEST_SKIP_SETUP === 'true'
    }
  ];
  const activePaths = optionalPaths.filter(({ active }) => Boolean(active));
  const paths = [
    ...activePaths,
    'e2e/tests/pages/**/*.spec.ts',
    'e2e/tests/navigation/**/*.spec.ts'
  ];

  return paths.join(',');
};
const baseUrl = (process.env.TEST_BASE_URL || 'https://localhost:8005').replace(/\/$/, '');

export default defineConfig({
  defaultCommandTimeout: 60000,
  trashAssetsBeforeRuns: true,
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
