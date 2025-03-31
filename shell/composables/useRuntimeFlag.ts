import { Store } from 'vuex';
import semver from 'semver';

import { getVersionInfo } from '@shell/utils/version';

let store: Store<any>;

export enum FEATURE {
  ACTION_MENU = 'actionMenu',
}

const featureVersionRequirements = { [FEATURE.ACTION_MENU]: '>=2.11.0' };

/**
 * Initializes runtime flags.
 * @param vuexStore The Vuex store instance
 */
export const useRuntimeFlag = (vuexStore: Store<any>) => {
  store = vuexStore;

  return { isFeatureEnabled };
};

/**
 * Check if a feature is enabled based on the current version.
 * @param feature The feature to check.
 * @returns A boolean indicating whether the feature is enabled.
 */
const isFeatureEnabled = (feature: FEATURE) => {
  const requirement = featureVersionRequirements[feature];
  const { fullVersion } = getVersionInfo(store);
  const coerced = semver.coerce(fullVersion) || { version: '0.0.0' };

  return requirement ? semver.satisfies(coerced.version, requirement) : false;
};
