/* eslint-disable no-console */
import { defineConfig } from 'cypress';
import { addMatchImageSnapshotPlugin } from '@emerson-eps/cypress-image-snapshot/plugin'

// Required for env vars to be available in cypress
require('dotenv').config();

// const baseUrl = (process.env.TEST_BASE_URL || 'https://localhost:8005').replace(/\/$/, '');
const baseUrl = 'http://localhost:6006/' // Storybook URL

/**
 * CONFIGURATION
 */
export default defineConfig({
  trashAssetsBeforeRuns: true,
  chromeWebSecurity:     false,
  video: false,
  screenshotOnRunFailure: false,
  // Define viewport to avoid issues with CI
  viewportWidth: 1000,
  viewportHeight: 660,
  retries: 0,
  env: {
    baseUrl,
    coverage: false
  },

  // https://docs.cypress.io/app/references/configuration#component
  component: {
    devServer: {
      bundler: 'webpack',
      framework: 'vue-cli',
      webpackConfig: require('@vue/cli-service/webpack.config.js')
    },
    specPattern: './visual/*.visual.{js,jsx,ts,tsx}',
    supportFile: false
  },

  // https://docs.cypress.io/app/references/configuration#Testing-Type-Specific-Options
  e2e: {
    experimentalSessionAndOrigin: true,
    supportFile: './visual/support.ts',
    specPattern: './visual/tests/*.visual.{js,jsx,ts,tsx}',
    baseUrl,
    screenshotOnRunFailure: false,
    setupNodeEvents(on, config) {
      addMatchImageSnapshotPlugin(on);
    },
  },
});
