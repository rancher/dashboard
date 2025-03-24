<script lang="ts">
import { Store, useStore } from 'vuex';
import ResourceTable from '@shell/components/ResourceTable.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { useI18n } from '@shell/composables/useI18n';
import { INGRESS, SERVICE } from '@shell/config/types';

export interface Props {
  ingresses?: any[];
  ingressesHeaders?: any[];
  ingressesSchema?: any;
  servicesSchema?: any;
  weight?: number;
}

export const fetchDefaultIngressesProps = async(store: Store<any>): Promise<Props> => {
  const allIngresses = await store.dispatch('cluster/findAll', { type: INGRESS });
  const ingressesSchema = store.getters['cluster/schemaFor'](INGRESS);
  const servicesSchema = store.getters['cluster/schemaFor'](SERVICE);

  return {
    ingresses:        allIngresses,
    ingressesHeaders: store.getters['type-map/headersFor'](ingressesSchema),
    ingressesSchema,
    servicesSchema
  };
};
</script>

<script lang="ts" setup>
const {
  ingresses, ingressesHeaders, ingressesSchema, servicesSchema, weight
} = defineProps<Props>();

const store = useStore();
const { t } = useI18n(store);
</script>

<template>
  <Tab
    v-if="ingresses"
    name="ingresses"
    :label="t('workload.detail.ingresses')"
    :weight="weight"
  >
    <p
      v-if="!servicesSchema"
      class="caption"
    >
      {{ t('workload.detail.cannotViewIngressesBecauseCannotViewServices') }}
    </p>
    <p
      v-else-if="!ingressesSchema"
      class="caption"
    >
      {{ t('workload.detail.cannotViewIngresses') }}
    </p>
    <p
      v-else-if="ingresses.length === 0"
      class="caption"
    >
      {{ t('workload.detail.cannotFindIngresses') }}
    </p>
    <p
      v-else
      class="caption"
    >
      {{ t('workload.detail.ingressListCaption') }}
    </p>
    <ResourceTable
      v-if="ingressesSchema && ingresses.length > 0"
      :rows="ingresses"
      :headers="ingressesHeaders"
      key-field="id"
      :schema="ingressesSchema"
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
