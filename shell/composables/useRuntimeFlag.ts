import { computed } from 'vue';
import { Store } from 'vuex';
import semver from 'semver';

import { getVersionInfo } from '@shell/utils/version';

let store: Store<any>;

/**
 * Initializes runtime flags.
 * @param vuexStore The Vuex store instance
 */
export const useRuntimeFlag = (vuexStore: Store<any>) => {
  store = vuexStore;

  return { featureDropdownMenu };
};

/**
 * Check if the dropdown menu feature is enabled
 * @returns A boolean indicating whether the dropdownMenu feature is enabled.
 */
const featureDropdownMenu = computed(() => {
  const { fullVersion } = getVersionInfo(store);

  const coerced = semver.coerce(fullVersion) || { version: '0.0.0' };

  return semver.gte(coerced.version, '2.11.0');
});
