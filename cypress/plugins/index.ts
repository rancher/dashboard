/// <reference types="cypress" />
require('dotenv').config();

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  const url = process.env.TEST_BASE_URL || 'https://localhost:8005';

  config.baseUrl = url.replace(/\/$/, '');

  config.env.username = process.env.TEST_USERNAME;
  config.env.password = process.env.TEST_PASSWORD;
  config.env.bootstrapPassword = process.env.CATTLE_BOOTSTRAP_PASSWORD;
  config.env.skip_setup = process.env.TEST_SKIP_SETUP;
  config.testFiles = skipSetup(config);

  return config;
};

/**
 * Remove setup files from the Cypress config
 * @param config Cypress config file
 * @returns
 */
const skipSetup = (config: Cypress.PluginConfigOptions) => {
  if (config.env.skip_setup === 'true') {
    return (config.testFiles as string[]).filter(
      path => !path.includes('tests/setup/')
    );
  } else {
    return config.testFiles;
  }
};
