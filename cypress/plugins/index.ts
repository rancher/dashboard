/* eslint-disable no-console */
/// <reference types="cypress" />
require('dotenv').config();
const { rmdir } = require('fs');

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
) => {
  deletePassedVideos(on);

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

/**
 * Only upload videos for specs with failing
 * Run this function after every spec to delete passed tests video
 * https://docs.cypress.io/guides/guides/screenshots-and-videos#Only-upload-videos-for-specs-with-failing-or-retried-tests
 *
 * @param on
 */
const deletePassedVideos = (on: Cypress.PluginEvents) => {
  on('after:spec', (_, results) => {
    // console.log(results);
    if (results && results.video) {
      const failures = results.tests.filter(({ state }) => state === 'failed');

      if (!failures.length) {
        console.log('Deleting video for passed tests');

        return new Promise((resolve, reject) => {
          rmdir(
            results.video,
            { maxRetries: 10, recursive: true },
            (err: Error) => {
              if (err) {
                console.error(err);

                return reject(err);
              }

              return resolve();
            }
          );
        });
      }
    }
  });
};
