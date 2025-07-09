import { useRoute } from 'vue-router';
import { LEGACY } from '@shell/config/query-params';
import { computed } from 'vue';

const enabledByDefault = true;

export const useIsNewDetailPageEnabled = () => {
  const route = useRoute();

  return computed(() => {
    if (enabledByDefault) {
      return route?.query?.[LEGACY] !== 'true';
    }

    return route?.query?.[LEGACY] === 'false';
  });
};
