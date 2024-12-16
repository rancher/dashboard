/* eslint-disable no-console */
import { defineConfig } from 'cypress';
const { initPlugin } = require('cypress-plugin-snapshots/plugin');

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
  retries:               {
    runMode:  2,
    openMode: 0
  },
  env: {
    baseUrl,
    // https://github.com/meinaart/cypress-plugin-snapshots?tab=readme-ov-file#make-changes-to-default-configuration
    "cypress-plugin-snapshots": {
      imageConfig: {
        "threshold": 0.001,             // Amount in pixels or percentage before snapshot image is invalid
      },
    },
  },
  component: {
    devServer: {
      bundler: 'webpack',
      framework: 'vue-cli',
      webpackConfig: require('@vue/cli-service/webpack.config.js')
    },
    specPattern: './cypress/visual/*.visual.{js,jsx,ts,tsx}',
    supportFile: false
  },

  e2e: {
    experimentalSessionAndOrigin: true,
    specPattern: './cypress/visual/*.visual.{js,jsx,ts,tsx}',
    baseUrl,
    setupNodeEvents(on, config) {
      initPlugin(on, config);
      return config;
    },
  },
});
