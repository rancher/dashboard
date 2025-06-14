<script lang="ts">
import { useStore } from 'vuex';
import ResourceTable from '@shell/components/ResourceTable.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { useI18n } from '@shell/composables/useI18n';
import { SERVICE } from '@shell/config/types';
import { matches } from '@shell/utils/selector';
import { toValue } from 'vue';

export interface Props {
  services?: any[];
  servicesHeaders?: Object;
  servicesSchema?: any;
  weight?: number;
}

export const filterServicesForDeployment = (workload: any, servicesSchema: any, services: any[]): any[] => {
  if (!servicesSchema) {
    return [];
  }

  const workloadValue = toValue(workload);
  const matchingPods = workloadValue.pods;

  // Find Services that have selectors that match this
  // workload's Pod(s).
  const filteredServices = services.filter((service) => {
    const selector = service.spec.selector;

    for (let i = 0; i < matchingPods.length; i++) {
      const pod = matchingPods[i];

      if (service.metadata?.namespace === workloadValue.metadata?.namespace && matches(pod, selector)) {
        return true;
      }
    }

    return false;
  });

  return filteredServices;
};

export const useFetchDefaultServicesProps = async(workload: any) => {
  const store = useStore();

  const allServices = await store.dispatch('cluster/findAll', { type: SERVICE });
  const schema = store.getters['cluster/schemaFor'](SERVICE);

  return {
    services:        filterServicesForDeployment(workload, schema, allServices),
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
    :label="`${t('workload.detail.services')} (${services.length})`"
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
