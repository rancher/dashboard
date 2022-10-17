import { defineConfig } from 'cypress';
// Required for env vars to be available in cypress
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
  projectId:              process.env.TEST_PROJECT_ID,
  defaultCommandTimeout:  60000,
  trashAssetsBeforeRuns:  true,
  env:                    {
    baseUrl,
    coverage:             false,
    codeCoverage: {
      exclude: [
        'cypress/**/*.*',
        '**/__tests__/**/*.*',
        '**/shell/scripts/**/*.*',
      ],
      include: [
        'shell/**/*.{vue,ts,js}',
        'pkg/rancher-components/src/components/**/*.{vue,ts,js}',
      ]
    },
    username:             process.env.TEST_USERNAME,
    password:             process.env.TEST_PASSWORD,
    bootstrapPassword:    process.env.CATTLE_BOOTSTRAP_PASSWORD,
  },
  e2e:                   {
    setupNodeEvents(on, config) {
      // For more info: https://docs.cypress.io/guides/tooling/code-coverage
      require('@cypress/code-coverage/task')(on, config);

      return config;
    },
    experimentalSessionAndOrigin: true,
    specPattern:                  getSpecPattern(),
    baseUrl
  },
});
