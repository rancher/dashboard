<script lang="ts">
import { useStore } from 'vuex';
import ResourceTable from '@shell/components/ResourceTable.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { useI18n } from '@shell/composables/useI18n';
import { WORKLOAD_TYPES } from '@shell/config/types';
import { toValue } from 'vue';

export interface Props {
  cronJobs?: any[];
  cronJobsHeaders?: any[];
  cronJobsSchema?: any;
  weight?: number;
}

export const useFetchDefaultCronJobsProps = async(resource: any) => {
  const store = useStore();
  const resourceValue = toValue(resource);

  // All cronjobs and jobs must be present in order for the 'resourceValue.jobs' model getter to function
  const [allCronJobs, allJobs] = await Promise.all([
    store.dispatch('cluster/findAll', { type: WORKLOAD_TYPES.CRON_JOB }),
    store.dispatch('cluster/findAll', { type: WORKLOAD_TYPES.JOB })
  ]);

  return {
    allJobs,
    allCronJobs,
    cronJobs:        resourceValue.jobs,
    cronJobsHeaders: store.getters['type-map/headersFor'](WORKLOAD_TYPES.CRON_JOB),
    cronJobsSchema:  store.getters['cluster/schemaFor'](WORKLOAD_TYPES.CRON_JOB)
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
    :label="`${t('tableHeaders.jobs')} (${cronJobs.length})`"
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
