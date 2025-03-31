import { computed } from 'vue';
import { Store } from 'vuex';
import semver from 'semver';

import { getVersionInfo } from '@shell/utils/version';

let store: Store<any>;

export const useFeatureFlag = (vuexStore: Store<any>) => {
  store = vuexStore;

  return { featureDropdownMenu };
};

const featureDropdownMenu = computed(() => {
  const { fullVersion } = getVersionInfo(store);

  const coerced = semver.coerce(fullVersion) || { version: '0.0.0' };

  return semver.gte(coerced.version, '2.11.0');
});
