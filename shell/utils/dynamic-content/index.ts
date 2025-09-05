/**
 * This is the main dynamic content file that provides the 'fetchAndProcessDynamicContent' function
 *
 * This is the main entry point for reading and processing dynamic content
 */

import day from 'dayjs';
import * as jsyaml from 'js-yaml';
import semver from 'semver';
import { isAdminUser } from '@shell/store/type-map';
import { getVersionData } from '@shell/config/version';
import { processReleaseVersion } from './new-release';
import { processSupportNotices } from './support-notice';
import { Context, DynamicContent } from './types';
import { createLogger, LOCAL_STORAGE_CONTENT_DEBUG_LOG } from './util';
import { getConfig } from './config';
import { SystemInfoProvider } from './info';

const FETCH_DELAY = 3 * 1000; // Short delay to let UI settle before we fetch the updates document
const FETCH_REQUEST_TIMEOUT = 15000; // Time out the request after 15 seconds
const FETCH_CONCURRENT_SECONDS = 30; // Time to wait to ignore another in-porgress fetch (seconds)

const UPDATE_DATE_FORMAT = 'YYYY-MM-DD'; // Format of the fetch date

const LOCAL_STORAGE_UPDATE_FETCH_DATE = 'rancher-updates-fetch-next'; // Local storage setting that holds the date when we should next try and fetch content
const LOCAL_STORAGE_UPDATE_CONTENT = 'rancher-updates-last-content'; // Local storage setting that holds the last fetched content
const LOCAL_STORAGE_UPDATE_ERRORS = 'rancher-updates-fetch-errors'; // Local storage setting that holds the count of contiguous errors
const LOCAL_STORAGE_UPDATE_FETCHING = 'rancher-updates-fetching'; // Local storage setting that holds the date and time of the last fetch that was started
const LOCAL_STORAGE_TEST_DATA = 'rancher-updates-test-data'; // Local storage setting that holds test data to be used when in debug mode

const BACKOFFS = [1, 1, 1, 2, 2, 3, 5]; // Backoff in days for the contiguous number of errors (i.e. after 1 errors, we wait 1 day, after 3 errors, we wait 2 days, etc.)

const DEFAULT_RELEASE_NOTES_URL = 'https://github.com/rancher/rancher/releases/tag/v$version'; // Default release notes URL

/**
 * Fetch dynamic content if needed and process it if it has changed since we last checked
 */
export async function fetchAndProcessDynamicContent(dispatch: Function, getters: any, axios: any) {
  // Check that the product is Rancher
  // => Check that we are NOT in single product mode (e.g. Harvester)
  const isSingleProduct = getters['isSingleProduct'];

  if (!!isSingleProduct) {
    return;
  }

  const config = getConfig(getters);

  // Common context to pass through to functions for store access, logging, etc
  const context = {
    dispatch,
    getters,
    axios,
    logger:  createLogger(config),
    isAdmin: isAdminUser(getters),
    config,
  };

  // If not enabled via the configuration, then just return
  if (!config.enabled) {
    console.log('Dynamic content disabled through configuration'); // eslint-disable-line no-console

    return;
  }

  context.logger.debug('Read configuration', context.config);

  try {
    // Fetch the dynamic content if required, otherwise return the cached content or empty object if no content available
    let content = await fetchDynamicContent(context);

    const versionData = getVersionData();
    const version = semver.coerce(versionData.Version);

    if (!version) {
      return;
    }

    const versionInfo = {
      version,
      isPrime: versionData.RancherPrime === 'true',
    };

    // Allow test content to be read from local storage when in debug mode only
    if (config.debug) {
      try {
        const data = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_TEST_DATA) || '{}');

        if (data?.version) {
          versionInfo.version = semver.coerce(data.version) as any;
        }

        if (data?.content) {
          content = data.content;

          context.logger.debug('Using test content from local storage (developer mode)');
        }
      } catch (e) {
        context.logger.debug('Failed to read test content from local storage', e);
      }
    } else {
      // Delete any test content in local storage when not in debug mode
      try {
        window.localStorage.removeItem(LOCAL_STORAGE_TEST_DATA);

        if (!config.log) {
          window.localStorage.removeItem(LOCAL_STORAGE_CONTENT_DEBUG_LOG);
        }
      } catch {}
    }

    // Add the settings data to the context, so that it is guarenteed to have the settings with their defaults or values from the dynamic content payload
    const contextWithSettings = {
      ...context,
      settings: {
        releaseNotesUrl: content.settings?.releaseNotesUrl || DEFAULT_RELEASE_NOTES_URL,
        suseExtensions:  [],
      }
    };

    // We always process the content in case the Rancher version has changed or the date means that an announcement/notification should now be shown

    // New release notifications and support notifications are shown to ALL community users, but only to admin users when Prime
    if (!config.prime || context.isAdmin) {
    // New release notifications
      processReleaseVersion(contextWithSettings, content.releases, versionInfo);

      // EOM, EOL notifications
      processSupportNotices(contextWithSettings, content.support, versionInfo);
    }
  } catch (e) {
    context.logger.error('Error reading or processing dynamic content', e);
  }
}

/**
 * We use a signal to timeout the connection
 * For air-gapped environments, this ensures the request will timeout after FETCH_REQUEST_TIMEOUT
 * This timeout is set relaively low (15s). The default, otherwise, is 2 minutes.
 *
 * @param timeoutMs Time in milliseconds after which the abort signal should signal
 */
function newRequestAbortSignal(timeoutMs: number) {
  const abortController = new AbortController();

  setTimeout(() => abortController.abort(), timeoutMs || 0);

  return abortController.signal;
}

/**
 * Update the local storage data that tracks when to next fetch content and how many consecutive errors we have had
 *
 * @param didError Indicates if we should update to record content retrieved without error or with error
 */
function updateFetchInfo(didError: boolean) {
  if (!didError) {
    // No error, so check again tomorrow and remove the backoff setting, so it will get its default next time
    try {
      const nextFetch = day().add(1, 'day');
      const nextFetchString = nextFetch.format(UPDATE_DATE_FORMAT);

      window.localStorage.setItem(LOCAL_STORAGE_UPDATE_FETCH_DATE, nextFetchString);
      window.localStorage.removeItem(LOCAL_STORAGE_UPDATE_ERRORS);
    } catch {}
  } else {
    // Did error, read the backoff, increase and add to the date
    try {
      const contiguousErrorsString = window.localStorage.getItem(LOCAL_STORAGE_UPDATE_ERRORS) || '0';

      let contiguousErrors = parseInt(contiguousErrorsString, 10);

      // Increase the number of errors that have happenned in a row
      contiguousErrors++;

      // Once we reach the max backoff, just stick with it
      if (contiguousErrors >= BACKOFFS.length ) {
        contiguousErrors = BACKOFFS.length - 1;
      }

      // Now find the backoff (days) given the error count and calculate the date of the next fetch
      const daysToAdd = BACKOFFS[contiguousErrors];
      const nextFetch = day().add(daysToAdd, 'day');
      const nextFetchString = nextFetch.format(UPDATE_DATE_FORMAT);

      window.localStorage.setItem(LOCAL_STORAGE_UPDATE_FETCH_DATE, nextFetchString);
      window.localStorage.setItem(LOCAL_STORAGE_UPDATE_ERRORS, contiguousErrors.toString());
    } catch {}
  }
}

/**
 * Fetch dynamic content (if needed)
 */
export async function fetchDynamicContent(context: Context): Promise<DynamicContent> {
  const { getters, logger, config } = context;

  // Check if we already have done an update check today
  let content: Partial<DynamicContent> = {};

  try {
    const today = day();
    const todayString = today.format(UPDATE_DATE_FORMAT);
    const nextFetch = window.localStorage.getItem(LOCAL_STORAGE_UPDATE_FETCH_DATE) || todayString;

    // Read the cached content from local storage if possible
    try {
      content = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_UPDATE_CONTENT) || '{}');
    } catch {}

    const nextFetchDay = day(nextFetch);

    // Just in case next day gets reset to the past or corrupt, otherwise next fetch needs to not be in the future
    if (!nextFetchDay.isValid() || !nextFetchDay.isAfter(today)) {
      logger.info(`Performing update check on ${ todayString }`);

      try {
        const activeFetch = window.localStorage.getItem(LOCAL_STORAGE_UPDATE_FETCHING);

        if (activeFetch) {
          const activeFetchDate = day(activeFetch);

          if (activeFetchDate.isValid() && today.diff(activeFetchDate, 'second') < FETCH_CONCURRENT_SECONDS) {
            logger.debug('Already fetching dynamic content in another tab (or previous tab closed while fetching) - skipping');

            return content as DynamicContent;
          }
        }
      } catch (e) {
        logger.error('Unable to check if another tab is fetching dynamic content', e);
      }

      // Set the local storage key that indicates a tab is fetching the content - prevents other tabs doing so at the same time
      try {
        window.localStorage.setItem(LOCAL_STORAGE_UPDATE_FETCHING, today.toString());
      } catch {}

      // Wait a short while before fetching dynamic content
      await new Promise((resolve) => setTimeout(resolve, FETCH_DELAY));

      const systemData = new SystemInfoProvider(getters, content?.settings || {});
      const qs = systemData.buildQueryString();
      const distribution = config.prime ? 'prime' : 'community';
      const url = `${ config.endpoint.replace('$dist', distribution) }?${ qs }`;

      logger.debug(`Fetching dynamic content from: ${ url.split('?')[0] }`, url);

      // We use axios directly so that we can pass in the abort signal to implement the connection timeout
      const res = await context.axios({
        url,
        method:          'get',
        timeout:         FETCH_REQUEST_TIMEOUT,
        noApiCsrf:       true,
        withCredentials: false,
        signal:          newRequestAbortSignal(FETCH_REQUEST_TIMEOUT),
      });

      // The data should be YAML in the 'data' attribute
      if (res?.data) {
        try {
          content = jsyaml.load(res.data) as any;

          window.localStorage.setItem(LOCAL_STORAGE_UPDATE_CONTENT, JSON.stringify(content));

          // Update the last date now
          updateFetchInfo(false);
        } catch (e) {
          logger.error('Failed to parse YAML from dynamic content package', e);
        }
      } else {
        logger.error('Error fetching dynamic content package (unexpected data)');
      }
    } else {
      logger.info(`Skipping update check for dynamic content - next check due on ${ nextFetch } (today is ${ todayString })`);

      // If debug mode, then wait a bit to simulate the delay we would have had if we were fetching
      if (config.debug) {
        await new Promise((resolve) => setTimeout(resolve, FETCH_DELAY));
      }
    }
  } catch (e) {
    logger.error('Error occurred reading dynamic content', e);

    // We had an error, so update data in local storage so that we try again appropriately next time
    updateFetchInfo(true);
  }

  // Remove the local storage key that indicates a tab is fetching the content
  try {
    window.localStorage.removeItem(LOCAL_STORAGE_UPDATE_FETCHING);
  } catch {}

  return content as DynamicContent;
}
