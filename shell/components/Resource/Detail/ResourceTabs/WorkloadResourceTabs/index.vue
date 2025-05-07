<script lang="ts">
import CronJobsTab, { Props as CronJobsProps, fetchDefaultCronJobsProps } from '@shell/components/Resource/Detail/ResourceTabs/WorkloadResourceTabs/CronJobsTab.vue';
import PodsTab, { Props as PodsProps, fetchDefaultPodsProps } from '@shell/components/Resource/Detail/ResourceTabs/WorkloadResourceTabs/PodsTab.vue';
import MetricsTab, { Props as MetricsTabProps, fetchDefaultProjectMetricsProps, fetchDefaultMetricsProps } from '@shell/components/Resource/Detail/ResourceTabs/WorkloadResourceTabs/MetricsTab.vue';
import ServicesTab, { Props as ServicesTabProps, fetchDefaultServicesProps } from '@shell/components/Resource/Detail/ResourceTabs/WorkloadResourceTabs/ServicesTab.vue';
import IngressesTab, { Props as IngressesTabProps, fetchDefaultIngressesProps } from '@shell/components/Resource/Detail/ResourceTabs/WorkloadResourceTabs/IngressesTab.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import { Store } from 'vuex';
import { I18n } from '@shell/composables/useI18n';

export interface Props {
  cronJobsTab: CronJobsProps;
  podsTab: PodsProps;
  metricsTab: MetricsTabProps;
  projectMetricsTab: MetricsTabProps;
  servicesTab: ServicesTabProps;
  ingressesTab: IngressesTabProps;
}

export const fetchDefaultWorkloadResourceTabs = async(store: Store<any>, i18n: I18n): Promise<Props> => {
  return {
    cronJobsTab:  await fetchDefaultCronJobsProps(store),
    podsTab:      await fetchDefaultPodsProps(store),
    metricsTab:   await fetchDefaultMetricsProps({}, i18n),
    // projectMetricsTab: await fetchDefaultProjectMetricsProps({}, store, i18n),
    servicesTab:  await fetchDefaultServicesProps(store),
    ingressesTab: await fetchDefaultIngressesProps(store),
  };
};

</script>

<script setup lang="ts">

const {
  cronJobsTab,
  podsTab,
  metricsTab,
  projectMetricsTab,
  servicesTab,
  ingressesTab,
} = defineProps<Props>();

</script>

<template>
  <ResourceTabs>
    <CronJobsTab
      v-bind="cronJobsTab"
      :weight="4"
    />
    <PodsTab
      v-bind="podsTab"
      :weight="4"
    />
    <MetricsTab
      v-bind="metricsTab"
      :weight="3"
    />
    <!-- <MetricsTab v-bind="projectMetricsTab" :weight="3"/> -->
    <ServicesTab
      v-bind="servicesTab"
      :weight="3"
    />
    <IngressesTab
      v-bind="ingressesTab"
      :weight="2"
    />
  </ResourceTabs>
</template>

<style lang='scss' scoped>

</style>
