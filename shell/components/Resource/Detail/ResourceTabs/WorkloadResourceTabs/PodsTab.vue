<script lang="ts">
import { Store, useStore } from 'vuex';
import ResourceTable from '@shell/components/ResourceTable.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { useI18n } from '@shell/composables/useI18n';
import { POD } from '@shell/config/types';

export interface Props {
  pods?: any[];
  podsHeaders?: any[];
  podsSchema?: any;
  weight?: number;
}

export const fetchDefaultPodsProps = async(store: Store<any>): Promise<Props> => {
  const allPods = await store.dispatch('cluster/findAll', { type: POD });
  const schema = store.getters['cluster/schemaFor'](POD);

  return {
    pods:        allPods,
    podsHeaders: store.getters['type-map/headersFor'](schema),
    podsSchema:  schema
  };
};
</script>

<script lang="ts" setup>
const {
  pods, podsHeaders, podsSchema, weight
} = defineProps<Props>();

const store = useStore();
const { t } = useI18n(store);
</script>

<template>
  <Tab
    v-if="pods"
    name="pods"
    :label="t('tableHeaders.pods')"
    :weight="weight"
  >
    <ResourceTable
      :rows="pods"
      :headers="podsHeaders"
      key-field="id"
      :schema="podsSchema"
      :groupable="false"
      :search="false"
    />
  </Tab>
</template>
