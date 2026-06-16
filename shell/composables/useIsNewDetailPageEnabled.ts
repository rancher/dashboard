import { useRoute } from 'vue-router';
import { LEGACY } from '@shell/config/query-params';
import { computed } from 'vue';
import { getVersionInfo } from '@shell/utils/version';
import semver from 'semver';
import { useStore } from 'vuex';

const enabledByDefault = true;

export const useIsNewDetailPageEnabled = () => {
  const route = useRoute();

  return computed(() => {
    const store = useStore();
    const { fullVersion } = getVersionInfo(store);

    const coerced = semver.coerce(fullVersion) || { version: '0.0.0' };

    if (!semver.gte(coerced.version, '2.12.0')) {
      return false;
    }

    if (enabledByDefault) {
      return route?.query?.[LEGACY] !== 'true';
    }

    return route?.query?.[LEGACY] === 'false';
  });
};
