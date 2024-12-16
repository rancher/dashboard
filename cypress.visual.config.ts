/* eslint-disable no-console */
import { defineConfig } from 'cypress';

// Required for env vars to be available in cypress
require('dotenv').config();

const baseUrl = (process.env.TEST_BASE_URL || 'https://localhost:8005').replace(/\/$/, '');


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
  },
  component: {
    devServer: {
      bundler: 'webpack',
      framework: 'vue',
      webpackConfig: require('@vue/cli-service/webpack.config.js')
    },
    specPattern: 'cypress/visual/*.visual.{js,jsx,ts,tsx}',
    supportFile: false
  },

  e2e: {
    experimentalSessionAndOrigin: true,
    specPattern: 'cypress/visual/*.visual.{js,jsx,ts,tsx}',
    baseUrl
  },
});
