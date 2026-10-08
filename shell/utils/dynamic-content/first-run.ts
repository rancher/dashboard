/**
 * Content of the release welcome modal, fetched from the dynamic content endpoint
 *
 * The modal has its content built in, but it can be updated after a release through the 'first-run' document, published
 * next to the dynamic content package (e.g. https://updates.rancher.io/rancher/community/first-run)
 *
 * Unlike the dynamic content package, the document is fetched straight away, when the modal is opened. When dynamic content
 * is disabled, or the document can't be fetched or has no valid content for the running version, the built-in content is used
 */

import * as jsyaml from 'js-yaml';
import { getConfig } from './config';
import { FirstRunContent, FirstRunFeature } from './types';
import { createLogger } from './util';

const FIRST_RUN_DOCUMENT = 'first-run';

// The modal waits for the document, so time out quicker than the dynamic content package (e.g. air-gapped environments)
const FETCH_REQUEST_TIMEOUT = 3000;

// One request per document and session: the modal can be reopened from the user menu, without waiting again
const requests: Record<string, Promise<Partial<FirstRunContent>>> = {};

/**
 * URL of the 'first-run' document: next to the dynamic content package, so it follows a custom endpoint (Prime)
 *
 * @param endpoint Dynamic content endpoint, e.g. 'https://updates.rancher.io/rancher/$dist/updates'
 * @param distribution 'community' or 'prime'
 */
export function firstRunUrl(endpoint: string, distribution: string): string {
  return new URL(FIRST_RUN_DOCUMENT, endpoint).toString().replace('$dist', distribution);
}

async function fetchDocument(axios: any, url: string): Promise<Partial<FirstRunContent>> {
  // The signal times out the connection too, not only the response (same as the dynamic content package)
  const abortController = new AbortController();

  setTimeout(() => abortController.abort(), FETCH_REQUEST_TIMEOUT);

  const res = await axios({
    url,
    method:          'get',
    timeout:         FETCH_REQUEST_TIMEOUT,
    noApiCsrf:       true,
    withCredentials: false,
    signal:          abortController.signal,
    responseType:    'text' // YAML or JSON
  });

  return (jsyaml.load(res?.data || '') || {}) as Partial<FirstRunContent>;
}

function isFeature(feature: any): feature is FirstRunFeature {
  return ['id', 'title', 'description'].every((key) => typeof feature?.[key] === 'string' && !!feature[key]);
}

/**
 * Features of the "What's new" card for the given version, or undefined when the document has no valid content for it.
 * Content is remote, so a release with any invalid feature is ignored as a whole
 */
export function firstRunFeatures(content: Partial<FirstRunContent> | undefined, version: string): FirstRunFeature[] | undefined {
  const releases = Array.isArray(content?.releases) ? content.releases : [];
  const features = releases.find((release) => release?.version === version)?.whatsNew;

  if (!Array.isArray(features) || !features.every(isFeature)) {
    return undefined;
  }

  return features.map(({ id, title, description }) => ({
    id, title, description
  }));
}

/**
 * Fetch the "What's new" features for the given version from the dynamic content endpoint
 *
 * @param getters Store getters, to read the dynamic content settings
 * @param axios Axios instance
 * @param version Minor version, e.g. '2.16'
 * @returns The features, or undefined when the built-in content should be used
 */
export async function fetchFirstRunFeatures(getters: any, axios: any, version: string): Promise<FirstRunFeature[] | undefined> {
  const config = getConfig(getters);

  if (!config.enabled) {
    return undefined;
  }

  const logger = createLogger(config);

  try {
    const url = firstRunUrl(config.endpoint, config.distribution);

    requests[url] = requests[url] || fetchDocument(axios, url);

    const features = firstRunFeatures(await requests[url], version);

    if (!features) {
      logger.info(`No valid release welcome content for ${ version } in ${ url }, using the built-in content`);
    }

    return features;
  } catch (e) {
    logger.info('Unable to fetch the release welcome content, using the built-in content', e);

    return undefined;
  }
}
