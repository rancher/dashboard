<script lang="ts">
import { Store, useStore } from 'vuex';
import ResourceTable from '@shell/components/ResourceTable.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { useI18n } from '@shell/composables/useI18n';
import { SERVICE } from '@shell/config/types';

export interface Props {
  services?: any[];
  servicesHeaders?: Object;
  servicesSchema?: any;
  weight?: number;
}

export const fetchDefaultServicesProps = async(store: Store<any>): Promise<Props> => {
  const allServices = await store.dispatch('cluster/findAll', { type: SERVICE });
  const schema = store.getters['cluster/schemaFor'](SERVICE);

  return {
    services:        allServices,
    servicesHeaders: store.getters['type-map/headersFor'](schema),
    servicesSchema:  schema,
  };
};
</script>

<script lang="ts" setup>
const {
  services, servicesHeaders, servicesSchema, weight
} = defineProps<Props>();

const store = useStore();
const { t } = useI18n(store);
</script>

<template>
  <Tab
    v-if="services"
    name="services"
    :label="t('workload.detail.services')"
    :weight="weight"
  >
    <p
      v-if="!servicesSchema"
      class="caption"
    >
      {{ t('workload.detail.cannotViewServices') }}
    </p>
    <p
      v-else-if="services.length === 0"
      class="caption"
    >
      {{ t('workload.detail.cannotFindServices') }}
    </p>
    <p
      v-else
      class="caption"
    >
      {{ t('workload.detail.serviceListCaption') }}
    </p>
    <ResourceTable
      v-if="servicesSchema && services.length > 0"
      :rows="services"
      :headers="servicesHeaders"
      key-field="id"
      :schema="servicesSchema"
      :groupable="false"
      :search="false"
      :table-actions="false"
    />
  </Tab>
</template>

<style lang="scss" scoped>
.caption {
  margin-bottom: .5em;
}
</style>
