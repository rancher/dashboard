<script lang="ts">
import { Store, useStore } from 'vuex';
import ResourceTable from '@shell/components/ResourceTable.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { useI18n } from '@shell/composables/useI18n';
import { WORKLOAD_TYPES } from '@shell/config/types';

export interface Props {
  cronJobs?: any[];
  cronJobsHeaders?: any[];
  cronJobsSchema?: any;
  weight?: number;
}

export const fetchDefaultCronJobsProps = async(store: Store<any>): Promise<Props> => {
  const allCronJobs = await store.dispatch('cluster/findAll', { type: WORKLOAD_TYPES.CRON_JOB });
  const schema = store.getters['cluster/schemaFor'](WORKLOAD_TYPES.CRON_JOB);

  return {
    cronJobs:        allCronJobs,
    cronJobsHeaders: store.getters['type-map/headersFor'](schema),
    cronJobsSchema:  schema
  };
};
</script>

<script lang="ts" setup>
const {
  cronJobs, cronJobsHeaders, cronJobsSchema, weight
} = defineProps<Props>();

const store = useStore();
const { t } = useI18n(store);
</script>

<template>
  <Tab
    v-if="cronJobs"
    name="jobs"
    :label="t('tableHeaders.jobs')"
    :weight="weight"
  >
    <ResourceTable
      :rows="cronJobs"
      :headers="cronJobsHeaders"
      key-field="id"
      :schema="cronJobsSchema"
      :groupable="false"
      :search="false"
    />
  </Tab>
</template>
