import { _CONFIG, VIEW } from '@shell/config/query-params';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

export const useCurrentView = () => {
  const route = useRoute();

  return computed(() => route.query[VIEW] || _CONFIG);
};
