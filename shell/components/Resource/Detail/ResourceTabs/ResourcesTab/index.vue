<script lang="ts">
import { useStore } from 'vuex';
import SortableTable from '@shell/components/SortableTable/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { useI18n } from '@shell/composables/useI18n';
import { COUNT } from '@shell/config/types';
import { computed, toValue } from 'vue';
import { useRoute } from 'vue-router';
import { getStatesByType } from '@shell/plugins/dashboard-store/resource-class';
import { findKey } from 'lodash';

export interface Props {
  namespacedResourceCounts: any[];
  weight?: number;
}

export const useFetchDefaultResourcesProps = async(resource: any) => {
  const store = useStore();
  const statesByType = getStatesByType();
  const resourceValue = toValue(resource);

  // sort states into 5 color-delineated categories: info, error, success, warning, unknown
  const reduceStates = (states: any, total:any): any => {
    const out: any = { success: total };

    Object.keys(states).forEach((state) => {
      out.success -= states[state];
      if (!!out[state]) {
        out[state] += states[state];
      } else {
        const genericStateKey = findKey(
          statesByType,
          (stateNames: any) => stateNames.includes(state)
        );

        if (genericStateKey) {
          out[genericStateKey] ? out[genericStateKey] += states[state] : out[genericStateKey] = states[state];
        } else {
          out.unknown ? out.unknown += states[state] : out.unknown = states[state];
        }
      }
    });

    return out;
  };

  const namespacedResourceCounts = computed(() => {
    const inStore = store.getters['currentProduct'].inStore;
    const allClusterResourceCounts = store.getters[`${ inStore }/all`](COUNT)[0].counts;

    return Object.keys(allClusterResourceCounts).reduce((namespaced, type) => {
      const typeCounts = allClusterResourceCounts[type];

      if (!typeCounts.namespaces || !typeCounts.namespaces[resourceValue.id]) {
        return namespaced;
      }
      const inNamespace = typeCounts.namespaces[resourceValue.id];

      namespaced.push({
        type,
        byState:    reduceStates(inNamespace.states || {}, inNamespace.count),
        totalCount: inNamespace.count,
        schema:     store.getters[`${ inStore }/schemaFor`](type)
      });

      return namespaced;
    }, [] as any);
  });

  return namespacedResourceCounts;
};
</script>

<script lang="ts" setup>
const { namespacedResourceCounts, weight } = defineProps<Props>();

const store = useStore();
const route = useRoute();
const { t } = useI18n(store);

const headers = [
  {
    name:  'type',
    label: t('tableHeaders.simpleType'),
    value: 'type'
  },
  {
    name:      'error',
    label:     t('namespace.resourceStates.error'),
    value:     'byState.error',
    sort:      'byState.error:desc',
    formatter: 'Number'
  },
  {
    name:      'warning',
    label:     t('namespace.resourceStates.warning'),
    value:     'byState.warning',
    sort:      'byState.warning:desc',
    formatter: 'Number'
  },
  {
    name:      'transitioning',
    label:     t('namespace.resourceStates.info'),
    value:     'byState.info',
    sort:      'byState.info:desc',
    formatter: 'Number'
  },
  {
    name:  'active',
    label: t('namespace.resourceStates.success'),
    sort:  'byState.success:desc',
    value: 'byState.success',
  },
  {
    name:      'unknown',
    label:     t('namespace.resourceStates.unknown'),
    sort:      'byState.unknown:desc',
    value:     'byState.unknown',
    formatter: 'Number'
  },
  {
    name:  'total',
    label: t('namespace.total'),
    sort:  'totalCount:desc',
    value: 'totalCount',
  },
];

const typeListLocation = (schema: any): any => {
  if (schema?.links?.collection) {
    const location = {
      name:   'c-cluster-product-resource',
      params: { ...route.params, resource: schema.shortId }
    };

    return location;
  }

  return null;
};
</script>

<template>
  <Tab
    :name="t('namespace.resources')"
    :label="`${t('namespace.resources')} (${namespacedResourceCounts?.length})`"
    :weight="weight"
  >
    <SortableTable
      default-sort-by="error"
      :table-actions="false"
      :row-actions="false"
      :rows="namespacedResourceCounts"
      :headers="headers"
    >
      <template #col:type="{row}">
        <td>
          <router-link
            v-if="typeListLocation(row.schema)"
            :to="typeListLocation(row.schema)"
          >
            {{ row.schema.pluralName }}
          </router-link>
          <span v-else>{{ row.schema.pluralName }}</span>
        </td>
      </template>
    </SortableTable>
  </Tab>
</template>
