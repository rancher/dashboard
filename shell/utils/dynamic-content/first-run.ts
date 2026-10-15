/**
 * Welcome modal content from the 'first-run' document of each distribution, published next to the dynamic content package
 * (e.g. https://updates.rancher.io/rancher/community/first-run). Each part comes from the exact version entry (e.g. '2.16.1'),
 * else the minor version entry (e.g. '2.16'), else the built-in content
 */

import * as jsyaml from 'js-yaml';
import { getConfig } from './config';
import {
  CallToAction, Configuration, FirstRunContent, FirstRunFeature, FirstRunPrimePromo, FirstRunRegistration, FirstRunRelease, FirstRunReleaseContent
} from './types';
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

// Whitespace only would render an empty title or chip
const isText = (value: any): value is string => typeof value === 'string' && !!value.trim();

// Opened by the modal, so only secure links (no javascript: or data: URLs)
const isCta = (cta: any): cta is CallToAction => isText(cta?.action) && isText(cta.link) && cta.link.startsWith('https://');

function isFeature(feature: any): feature is FirstRunFeature {
  return ['id', 'title', 'description'].every((key) => isText(feature?.[key]));
}

function isPrimePromo(promo: any): promo is FirstRunPrimePromo {
  return isText(promo?.title) &&
    isText(promo.description) &&
    Array.isArray(promo.products) &&
    promo.products.every(isText) &&
    isCta(promo.cta);
}

function isRegistration(registration: any): registration is FirstRunRegistration {
  return isText(registration?.title) &&
    isText(registration.description) &&
    Array.isArray(registration.benefits) &&
    registration.benefits.every((benefit: any) => isText(benefit?.text) && (benefit.link === undefined || isCta(benefit.link))) &&
    isCta(registration.cta);
}

/**
 * Versions of the document that apply to the running version, in order: the exact version, then its minor version
 *
 * @param version Running version, e.g. '2.16.1' (or a minor version, e.g. '2.16')
 */
export function firstRunVersions(version: string): string[] {
  const [major, minor, patch] = version.split('.');
  const minorVersion = `${ major }.${ minor }`;

  return patch === undefined ? [minorVersion] : [version, minorVersion];
}

function findRelease(content: Partial<FirstRunContent> | undefined, version: string): FirstRunRelease | undefined {
  const releases = Array.isArray(content?.releases) ? content.releases : [];

  return releases.find((release) => release?.version === version);
}

/**
 * First valid value of a part for the running version, from the exact version or else the minor version
 */
function findPart<T>(
  content: Partial<FirstRunContent> | undefined,
  version: string,
  part: keyof FirstRunRelease,
  isValid: (value: any) => boolean,
  copy: (value: any) => T
): { value: T, version: string } | undefined {
  for (const candidate of firstRunVersions(version)) {
    const value = findRelease(content, candidate)?.[part];

    if (isValid(value)) {
      return { value: copy(value), version: candidate };
    }
  }

  return undefined;
}

const isFeatures = (features: any) => Array.isArray(features) && features.every(isFeature);

const copyFeatures = (features: FirstRunFeature[]) => features.map(({ id, title, description }) => ({
  id, title, description
}));

const copyCta = (cta: CallToAction) => ({ action: cta.action, link: cta.link });

/**
 * Features of the "What's new" card for the running version, or undefined when the document has no valid content for it.
 * Content is remote, so a list with any invalid feature is ignored as a whole
 */
export function firstRunFeatures(content: Partial<FirstRunContent> | undefined, version: string): FirstRunFeature[] | undefined {
  return findPart(content, version, 'whatsNew', isFeatures, copyFeatures)?.value;
}

/**
 * Rancher Prime promotion (Community) for the running version, or undefined when the document has no valid promotion for it
 */
export function firstRunPrimePromo(content: Partial<FirstRunContent> | undefined, version: string): FirstRunPrimePromo | undefined {
  return findPart(content, version, 'primePromo', isPrimePromo, (promo: FirstRunPrimePromo) => ({
    title:       promo.title,
    description: promo.description,
    products:    [...promo.products],
    cta:         copyCta(promo.cta),
  }))?.value;
}

/**
 * Registration card (Prime) for the running version, or undefined when the document has no valid card for it
 */
export function firstRunRegistration(content: Partial<FirstRunContent> | undefined, version: string): FirstRunRegistration | undefined {
  return findPart(content, version, 'registration', isRegistration, (registration: FirstRunRegistration) => ({
    title:       registration.title,
    description: registration.description,
    benefits:    registration.benefits.map(({ text, link }) => (link ? { text, link: copyCta(link) } : { text })),
    cta:         copyCta(registration.cta),
  }))?.value;
}

/**
 * Fetch the document once per session, or undefined when dynamic content is disabled or the document can't be fetched
 */
async function loadDocument(getters: any, axios: any): Promise<{ content: Partial<FirstRunContent>, url: string, config: Configuration } | undefined> {
  const config = getConfig(getters);

  if (!config.enabled) {
    return undefined;
  }

  try {
    const url = firstRunUrl(config.endpoint, config.distribution);

    requests[url] = requests[url] || fetchDocument(axios, url);

    return {
      content: await requests[url], url, config
    };
  } catch (e) {
    createLogger(config).info('Unable to fetch the release welcome content, using the built-in content', e);

    return undefined;
  }
}

/**
 * Fetch the modal content for the running version: the Prime promotion for Community, the registration card for Prime.
 * Undefined parts use the built-in content
 *
 * @param getters Store getters, to read the dynamic content settings
 * @param axios Axios instance
 * @param version Running version, e.g. '2.16.1'
 */
export async function fetchFirstRunContent(getters: any, axios: any, version: string): Promise<FirstRunReleaseContent> {
  const document = await loadDocument(getters, axios);

  if (!document) {
    return {};
  }

  const { content, url, config } = document;
  const features = findPart(content, version, 'whatsNew', isFeatures, copyFeatures);
  const result: FirstRunReleaseContent = { features: features?.value, matchedVersion: features?.version };

  if (config.prime) {
    result.registration = firstRunRegistration(content, version);
  } else {
    result.primePromo = firstRunPrimePromo(content, version);
  }

  const builtIn = [
    !result.features && 'whatsNew',
    config.prime ? !result.registration && 'registration' : !result.primePromo && 'primePromo',
  ].filter(Boolean);

  if (builtIn.length) {
    createLogger(config).info(`No valid ${ builtIn.join(', ') } for ${ version } in ${ url }, using the built-in content`);
  }

  return result;
}

/**
 * Whether the document has an entry for this exact version (e.g. '2.16.1'), so the modal is shown again after a patch upgrade
 */
export async function hasExactFirstRunRelease(getters: any, axios: any, version: string): Promise<boolean> {
  if (firstRunVersions(version).length < 2) {
    return false;
  }

  const document = await loadDocument(getters, axios);

  return !!findRelease(document?.content, version);
}
