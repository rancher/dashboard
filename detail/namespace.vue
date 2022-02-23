<script>
import findKey from 'lodash/findKey';
import CreateEditView from '@/mixins/create-edit-view';
import FleetSummary from '@/components/fleet/FleetSummary';
import ResourceTabs from '@/components/form/ResourceTabs';
import { COUNT } from '@/config/types';
import { getStatesByType } from '@/plugins/steve/resource-class';
import MoveModal from '@/components/MoveModal';
import Tab from '@/components/Tabbed/Tab';
import SortableTable from '@/components/SortableTable';

export default {
  components: {
    FleetSummary,
    ResourceTabs,
    MoveModal,
    Tab,
    SortableTable
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
    const headers = [
      {
        name:  'type',
        label: this.t('tableHeaders.simpleType'),
        value: 'type'
      },
      {
        name:      'error',
        label:     this.t('namespace.resourceStates.error'),
        value:     'byState.error',
        sort:      'byState.error:desc',
        formatter: 'Number'
      },
      {
        name:      'warning',
        label:     this.t('namespace.resourceStates.warning'),
        value:     'byState.warning',
        sort:      'byState.warning:desc',
        formatter: 'Number'
      },
      {
        name:      'transitioning',
        label:     this.t('namespace.resourceStates.info'),
        value:     'byState.info',
        sort:      'byState.info:desc',
        formatter: 'Number'
      },
      {
        name:      'active',
        label:     this.t('namespace.resourceStates.success'),
        sort:      'byState.success:desc',
        value: 'byState.success',
      },
      {
        name:      'unknown',
        label:     this.t('namespace.resourceStates.unknown'),
        sort:      'byState.unknown:desc',
        value:     'byState.unknown',
        formatter: 'Number'
      },
      {
        name:      'total',
        label:     this.t('namespace.total'),
        sort:      'totalCount:desc',
        value:     'totalCount',
      },
    ];

    return { resourceTypes: [], headers };
  },

  computed: {
    inStore() {
      return this.$store.getters['currentProduct'].inStore;
    },

    namespacedResourceCounts() {
      const allClusterResourceCounts = this.$store.getters[`${ this.inStore }/all`](COUNT)[0].counts;

      return Object.keys(allClusterResourceCounts).reduce((namespaced, type) => {
        const typeCounts = allClusterResourceCounts[type];

        if (!typeCounts.namespaces || !typeCounts.namespaces[this.value.id]) {
          return namespaced;
        }
        const inNamespace = typeCounts.namespaces[this.value.id];

        namespaced.push({
          type,
          byState:     this.reduceStates(inNamespace.states || {}, inNamespace.count),
          totalCount:    inNamespace.count,
          schema:     this.schemaFor(type)
        });

        return namespaced;
      }, []);
    },

    accumulatedStateCounts() {
      const totals = {};

      for (const state in this.statesByType) {
        totals[state] = 0;
      }

      return this.namespacedResourceCounts.reduce((sum, type) => {
        for (const state in type.byState) {
          sum[state] += type.byState[state];
        }

        return sum;
      }, totals);
    },

    statesByType() {
      return getStatesByType();
    },
  },

  methods: {
    // sort states into 5 color-delineated categories: info, error, success, warning, unknown
    reduceStates(states, total) {
      const out = { success: total };

      Object.keys(states).forEach((state) => {
        out.success -= states[state];
        if (!!out[state]) {
          out[state] += states[state];
        } else {
          const genericStateKey = findKey(
            this.statesByType,
            stateNames => stateNames.includes(state)
          );

          if (genericStateKey) {
            out[genericStateKey] ? out[genericStateKey] += states[state] : out[genericStateKey] = states[state];
          } else {
            out.unknown ? out.unknown += states[state] : out.unknown = states[state];
          }
        }
      });

      return out;
    },

    schemaFor(type) {
      return this.$store.getters[`${ this.inStore }/schemaFor`](type);
    },

    typeListLocation(schema) {
      if (schema?.links?.collection) {
        const location = {
          name:   'c-cluster-product-resource',
          params: { ...this.$route.params, resource: schema.shortId }
        };

        return location;
      }

      return null;
    }
  }
};
</script>

<template>
  <div>
    <div class="mb-20">
      <h3>{{ t('namespace.resources') }}</h3>
      <FleetSummary state-key="namespace.resourceStates" :value="accumulatedStateCounts" :required-states="['success', 'info', 'warning', 'error', 'unknown']" />
    </div>
    <ResourceTabs v-model="value" :mode="mode">
      <Tab :name="t('namespace.resources')">
        <SortableTable default-sort-by="error" :table-actions="false" :row-actions="false" :rows="namespacedResourceCounts" :headers="headers">
          <template #col:type="{row}">
            <td>
              <n-link v-if="typeListLocation(row.schema)" :to="typeListLocation(row.schema)">
                {{ row.schema.pluralName }}
              </n-link>
              <span v-else>{{ row.schema.pluralName }}</span>
            </td>
          </template>
        </SortableTable>
      </Tab>
    </ResourceTabs>
    <MoveModal />
  </div>
</template>
