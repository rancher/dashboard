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
  // Disabled due freezing issues related to the CI machine resources
  // deletePassedVideos(on);

  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  config.env.username = process.env.TEST_USERNAME;
  config.env.password = process.env.TEST_PASSWORD;
  config.env.bootstrapPassword = process.env.CATTLE_BOOTSTRAP_PASSWORD;

  return config;
};

/**
 * Only upload videos for specs with failing
 * Run this function after every spec to delete passed tests video
 * https://docs.cypress.io/guides/guides/screenshots-and-videos#Only-upload-videos-for-specs-with-failing-or-retried-tests
 * TODO: Integrate this function when enabling videos once again with #6048
 *
 * @param on
 */
// eslint-disable-next-line no-unused-vars
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
