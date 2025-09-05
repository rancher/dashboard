import day from 'dayjs';
import * as jsyaml from 'js-yaml';
import semver from 'semver';
import { sha256 } from '@shell/utils/crypto';
import {
  COUNT,
  MANAGEMENT,
} from '@shell/config/types';
import { isAdminUser } from '@shell/store/type-map';
import { getVersionData } from '@shell/config/version';
import { SETTING } from '@shell/config/settings';
import { processReleaseVersion } from './new-release';
import { processSupportNotices } from './support-notice';
import { Context, DynamicContent } from './types';
import { createLogger, LOCAL_STORAGE_CONTENT_DEBUG_LOG } from './util';
import { getConfig } from './config';

const QS_VERSION = 'v1'; // Include a version number in the query string in case we want to version the set of params we are sending
const UNKNOWN = 'unknown';
const FETCH_DELAY = 3 * 1000; // Short delay to let UI settle before we fetch the updates document
const FETCH_REQUEST_TIMEOUT = 15000; // Time out the request after 15 seconds
const FETCH_CONCURRENT_SECONDS = 30; // Time to wait to ignore another in-porgress fetch

// List of known UI extensions from SUSE
const SUSE_EXTENSIONS = [
  'capi',
  'elemental',
  'harvester',
  'kubewarden',
  'neuvector-ui-ext',
  'observability',
  'supportability-review-app',
  'virtual-clusters'
];

const UPDATE_DATE_FORMAT = 'YYYY-MM-DD'; // Format of the fetch date

const LOCAL_STORAGE_UPDATE_FETCH_DATE = 'rancher-updates-fetch-next'; // Local storage setting that holds the date when we should next try and fetch content
const LOCAL_STORAGE_UPDATE_CONTENT = 'rancher-updates-last-content'; // Local storage setting that holds the last fetched content
const LOCAL_STORAGE_UPDATE_ERRORS = 'rancher-updates-fetch-errors'; // Local storage setting that holds the count of contiguos errors
const LOCAL_STORAGE_UPDATE_FETCHING = 'rancher-updates-fetching'; // Local storage setting that holds the date and time of the last fetch that was started
const LOCAL_STORAGE_TEST_DATA = 'rancher-updates-test-data'; // Local storage setting that holds test data to be used when in debug mode

const BACKOFFS = [1, 1, 1, 2, 2, 3, 5]; // Backoff in days for the contiguos number of errors (i.e. after 1 errors, we wait 1 day, after 3 errors, we wait 2 days, etc.)

type ExtensionInfo = {
  knownInstalled: string[];
  customCount: number;
};

type SystemInfo = {
  systemUUID: string;
  systemHash: string;
  userHash: string;
  version: string;
  isDeveloperVersion: boolean;
  isPrime: boolean;
  clusterCount: number;
  localCluster: any;
  extensions?: ExtensionInfo;
  browserSize: string;
  screenSize: string;
  language: string;
};

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

  context.logger.debug('Read configuration', context.config);

  try {
    // Check if we already have done an update check today
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

    // We always process the content in case the Rancher version has changed or the date means that
    // an announcement/notification should now be shown

    // New release notifications
    processReleaseVersion(context, content.releases, versionInfo);

    // EOM, EOL notifications
    processSupportNotices(context, content.support, versionInfo);
  } catch (e) {
    context.logger.error('Error reading or processing dynamic content', e);
  }
}

// We use a signal to timeout the connection
// For air-gapped environments, this ensures the request will timeout after FETCH_REQUEST_TIMEOUT
// This timeout is set relaively low (15s). The default, otherwise, is 2 minutes.
function newRequestAbortSignal(timeoutMs: number) {
  const abortController = new AbortController();

  setTimeout(() => abortController.abort(), timeoutMs || 0);

  return abortController.signal;
}

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
      const contiguosErrorsString = window.localStorage.getItem(LOCAL_STORAGE_UPDATE_ERRORS) || '0';

      let contiguosErrors = parseInt(contiguosErrorsString, 10);

      // Increase the number of errors that have happenned in a row
      contiguosErrors++;

      // Once we reach the max backoff, just stick with it
      if (contiguosErrors >= BACKOFFS.length ) {
        contiguosErrors = BACKOFFS.length - 1;
      }

      // Now find the backoff (days) given the error count and calculate the date of the next fetch
      const daysToAdd = BACKOFFS[contiguosErrors];
      const nextFetch = day().add(daysToAdd, 'day');
      const nextFetchString = nextFetch.format(UPDATE_DATE_FORMAT);

      window.localStorage.setItem(LOCAL_STORAGE_UPDATE_FETCH_DATE, nextFetchString);
      window.localStorage.setItem(LOCAL_STORAGE_UPDATE_ERRORS, contiguosErrors.toString());
    } catch {}
  }
}

/**
 * Fetch dynamic content (if needed)
 */
export async function fetchDynamicContent(context: Context): Promise<DynamicContent> {
  const { getters, logger, config } = context;

  // Check if we already have done an update check today
  let content = {};

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

      const systemData = getSystemData(getters);
      const qs = buildQueryString(systemData);
      const distribution = getVersionData().RancherPrime === 'true' ? 'prime' : 'community';
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

// Helper to get all resources of a type only if they are available
function getAll(getters: any, typeName: string): any {
  if (getters['management/typeRegistered'](typeName)) {
    return getters['management/all'](typeName);
  }

  return undefined;
}

/**
 * Get the data that we need from the system
 * @param getters Store getters to access the store
 * @returns System data
 */
function getSystemData(getters: any): SystemInfo {
  const settings = getAll(getters, MANAGEMENT.SETTING);
  let url;
  let systemUUID = UNKNOWN;

  // Get server URL and UUID if we can access settings
  if (settings) {
    // Get the server URL if we can can
    const server = settings.find((setting: any) => setting.id === SETTING.SERVER_URL);

    if (server) {
      url = server.value || UNKNOWN;
    }

    // UUID
    const uuidSetting = settings.find((setting: any) => setting.id === 'install-uuid');

    if (uuidSetting) {
      systemUUID = uuidSetting.value || UNKNOWN;
    }
  }

  // Otherwise, use the window location's host
  url = url || window.location?.host;

  // System and User hashes
  const systemHash = (sha256(url, 'hex') as string).substring(0, 32);
  const currentPrincipal = getters['auth/principalId'] || UNKNOWN;
  const userHash = (sha256(currentPrincipal, 'hex') as string).substring(0, 32);

  // Version info
  const versionData = getVersionData();
  const vers = versionData.Version.split('-');

  // General stats that can help us shape content delivery

  // High-level information from clusters
  const counts = getAll(getters, COUNT)?.[0]?.counts || {};
  const clusterCount = counts[MANAGEMENT.CLUSTER] || {};
  const all = getAll(getters, MANAGEMENT.CLUSTER);
  const localCluster = all ? all.find((c: any) => c.isLocal) : undefined;

  // Stats for installed extensions
  const uiExtensionList = getters['uiplugins/plugins'];
  let extensions;

  if (uiExtensionList) {
    const notBuiltIn = uiExtensionList.filter((e: any) => !e.builtin);
    const suseNames = notBuiltIn.filter((e:any) => SUSE_EXTENSIONS.includes(e.name)).map((e: any) => e.name);
    const customCount = notBuiltIn.length - suseNames.length;

    extensions = {
      knownInstalled: suseNames,
      customCount,
    };
  }

  const screenSize = `${ window.screen?.width || '?' }x${ window.screen?.height || '?' }`;
  const browserSize = `${ window.innerWidth }x${ window.innerHeight }`;

  return {
    systemUUID,
    userHash,
    systemHash,
    version:            vers[0],
    isDeveloperVersion: vers.length > 1,
    isPrime:            versionData.RancherPrime === 'true',
    clusterCount:       clusterCount?.summary?.count,
    localCluster,
    extensions,
    screenSize,
    browserSize,
    language:           window.navigator?.language,
  };
}

/**
 * Build query string of params to send so that we can deliver better content
 */
function buildQueryString(systemData: SystemInfo): string {
  const params = [`dcv=${ QS_VERSION }`];

  // System and User
  params.push(`s=${ systemData.systemHash }`);
  params.push(`u=${ systemData.userHash }`);

  // Install UUID
  if (systemData.systemUUID !== UNKNOWN) {
    params.push(`i=${ systemData.systemUUID }`);
  }

  // Version info
  params.push(`v=${ systemData.version }`);
  params.push(`dev=${ systemData.isDeveloperVersion }`);
  params.push(`p=${ systemData.isPrime }`);

  // Clusters
  params.push(`cc=${ systemData.clusterCount }`);

  if (systemData.localCluster) {
    params.push(`lkv=${ systemData.localCluster.kubernetesVersionBase || UNKNOWN }`);
    params.push(`lcp=${ systemData.localCluster.provisioner || UNKNOWN }`);
    params.push(`lnc=${ systemData.localCluster.status.nodeCount || 0 }`);
  }

  // Extensions
  if (systemData.extensions) {
    params.push(`xkn=${ systemData.extensions.knownInstalled.join(',') }`);
    params.push(`xcc=${ systemData.extensions.customCount }`);
  }

  // Browser Language
  params.push(`bl=${ systemData.language }`);

  // Browser size
  params.push(`bs=${ systemData.browserSize }`);

  // Screen size
  if (systemData.screenSize !== '?x?') {
    params.push(`ss=${ systemData.screenSize }`);
  }

  return params.join('&');
}
