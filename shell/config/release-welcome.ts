/**
 * Content of the welcome modal, shown once per minor release.
 *
 * Update WHATS_NEW_FEATURES for every minor release. The card is hidden when the list is empty.
 * The "What's new" features and the Prime promotion can be replaced after the release through dynamic content
 * (see shell/utils/dynamic-content/first-run.ts)
 */

export interface WhatsNewFeature {
  /**
   * Unique id, used for test ids
   */
  id: string;
  /**
   * Translation key of the feature title
   */
  titleKey: string;
  /**
   * Translation key of the feature description
   */
  descriptionKey: string;
}

export const WHATS_NEW_FEATURES: WhatsNewFeature[] = [
  {
    id:             'navigation',
    titleKey:       'releaseWelcome.whatsNew.features.navigation.title',
    descriptionKey: 'releaseWelcome.whatsNew.features.navigation.description',
  },
  {
    id:             'tables',
    titleKey:       'releaseWelcome.whatsNew.features.tables.title',
    descriptionKey: 'releaseWelcome.whatsNew.features.tables.description',
  },
  {
    id:             'kubernetes',
    titleKey:       'releaseWelcome.whatsNew.features.kubernetes.title',
    descriptionKey: 'releaseWelcome.whatsNew.features.kubernetes.description',
  },
  {
    id:             'hosted-provisioning',
    titleKey:       'releaseWelcome.whatsNew.features.hostedProvisioning.title',
    descriptionKey: 'releaseWelcome.whatsNew.features.hostedProvisioning.description',
  },
];

/**
 * Products listed in the Rancher Prime promotion, shown to Community installations
 */
export const PRIME_PRODUCTS = [
  'releaseWelcome.prime.products.manager',
  'releaseWelcome.prime.products.distributions',
  'releaseWelcome.prime.products.fleet',
  'releaseWelcome.prime.products.security',
  'releaseWelcome.prime.products.storage',
  'releaseWelcome.prime.products.virtualization',
  'releaseWelcome.prime.products.observability',
  'releaseWelcome.prime.products.appCollection',
];

/**
 * Benefits unlocked by registering a Prime installation
 */
export const PRIME_BENEFITS = [
  'releaseWelcome.registration.benefits.support',
  'releaseWelcome.registration.benefits.appCollection',
  'releaseWelcome.registration.benefits.images',
  'releaseWelcome.registration.benefits.academy',
];

export const PRIME_URL = 'https://www.suse.com/products/rancher/';

export const SCC_URL = 'https://scc.suse.com/';

export const SUPPORT_HANDBOOK_URL = 'https://www.suse.com/support/handbook/';

/**
 * Registration page added by the rancher-prime extension (pkg/rancher-prime/config/constants.ts)
 */
export const REGISTRATION_ROUTE = { name: 'c-cluster-settings-registration', params: { cluster: 'local' } };
