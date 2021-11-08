<script>
import findKey from 'lodash/findKey';
import has from 'lodash/has';
import reduce from 'lodash/reduce';

import CreateEditView from '@/mixins/create-edit-view';
import FleetSummary from '@/components/FleetSummary';
import ResourceTabs from '@/components/form/ResourceTabs';

import { COUNT } from '@/config/types';
import MoveModal from '@/components/MoveModal';
import { getStatesByType } from '@/plugins/core-store/resource-instance';

export default {
  components: {
    FleetSummary,
    ResourceTabs,
    MoveModal
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      default: 'create',
      type:    String,
    },
    value: {
      required: true,
      type:     Object,
    },
  },

  data() {
    return { resourceTypes: [] };
  },

  computed: {
    namespacedCounts() {
      const allClusterResourceCounts = this.$store.getters[`cluster/all`](COUNT)[0].counts;
      const statesByType = getStatesByType();
      const totalCountsOut = {
        success: 0,
        info:    0,
        warning: 0,
        error:   0,
        unknown: 0,
      };

      Object.keys(allClusterResourceCounts).forEach((resourceCount) => {
        if (allClusterResourceCounts?.[resourceCount]?.namespaces?.[this.value.id]) {
          const namespacedCounts = { ...allClusterResourceCounts[resourceCount].namespaces[this.value.id] };
          let total = namespacedCounts?.count || 0;

          if (namespacedCounts?.states) {
            const notSuccessful = reduce(
              namespacedCounts.states,
              (sum, value) => sum + value,
              0
            );

            if (notSuccessful && notSuccessful > 0) {
              total = total - notSuccessful;
            }

            Object.keys(namespacedCounts.states).forEach((state) => {
              if (has(totalCountsOut, state)) {
                totalCountsOut[state] += namespacedCounts.states[state];
              } else {
                const missingStateKey = findKey(
                  statesByType,
                  (stateNames, stateName) => stateNames.includes(state)
                );

                if (missingStateKey) {
                  totalCountsOut[missingStateKey] += namespacedCounts.states[state];
                } else {
                  totalCountsOut.unknown += namespacedCounts.states[state];
                }
              }
            });
          }

          totalCountsOut.success += total;
        }
      });

      return totalCountsOut;
    },
  },
};
</script>

<template>
  <div>
    <div class="mb-20">
      <h3>{{ t('namespace.resources') }}</h3>
      <FleetSummary state-key="namespace.resourceStates" :value="namespacedCounts" />
    </div>
    <ResourceTabs v-model="value" :mode="mode" />
    <MoveModal />
  </div>
</template>
