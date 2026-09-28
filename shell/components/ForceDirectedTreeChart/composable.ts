import { computed } from 'vue';
import { graphConfig } from '@shell/pages/c/_cluster/fleet/graph/config';

export const useDefaultForceDirectTreeChartProps = (resource: any) => {
  return computed(() => {
    return {
      data:      resource,
      fdcConfig: graphConfig
    };
  });
};
