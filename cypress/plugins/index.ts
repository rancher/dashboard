/// <reference types="cypress" />
require('dotenv').config();

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config

  const url = process.env.DEV_UI || 'https://localhost:8005';

  config.baseUrl = url.replace(/\/$/, '');

  config.env.username = process.env.TEST_USERNAME;
  config.env.password = process.env.TEST_PASSWORD;

  return config;
};
