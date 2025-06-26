import { useRoute } from 'vue-router';
import { LEGACY } from '@shell/config/query-params';

const enabledByDefault = true;

export const useIsNewDetailPageEnabled = () => {
  const route = useRoute();

  if (enabledByDefault) {
    return route.query[LEGACY] !== 'true';
  }

  return route.query[LEGACY] === 'false';
};
