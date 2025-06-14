<script lang="ts">
import CronJobsTab, { Props as CronJobsProps, useFetchDefaultCronJobsProps } from '@shell/components/Resource/Detail/ResourceTabs/WorkloadResourceTabs/CronJobsTab.vue';
import ResourceTableTab, { Props as PodsProps } from '@shell/components/Resource/Detail/ResourceTabs/ResourceTableTab/index.vue';
import { useFetchDefaultPodsTabProps } from '@shell/components/Resource/Detail/ResourceTabs/ResourceTableTab/composables';
import MetricsTab, { Props as MetricsTabProps, useFetchDefaultWorkloadProjectMetricsProps, useFetchDefaultWorkloadMetricsProps } from '@shell/components/Resource/Detail/ResourceTabs/MetricsTab/index.vue';
import ServicesTab, { Props as ServicesTabProps, useFetchDefaultServicesProps } from '@shell/components/Resource/Detail/ResourceTabs/WorkloadResourceTabs/ServicesTab.vue';
import IngressesTab, { Props as IngressesTabProps, useFetchDefaultIngressesProps } from '@shell/components/Resource/Detail/ResourceTabs/WorkloadResourceTabs/IngressesTab.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import { allHash } from '@shell/utils/promise';

export interface Props {
  relatedResources: any;
  cronJobsTab?: CronJobsProps;
  podsTab?: PodsProps;
  metricsTab?: MetricsTabProps;
  projectMetricsTab?: MetricsTabProps;
  servicesTab?: ServicesTabProps;
  ingressesTab?: IngressesTabProps;
  targetResource?: any;
  schema?: any;
}

export interface Hide {
  cronJobs?: boolean;
  pods?: boolean;
  metrics?: boolean;
  projectMetrics?: boolean;
  services?: boolean;
  ingresses?: boolean;
}

export const WORKLOAD_METRICS_DETAIL_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-workload-pods-1/rancher-workload-pods?orgId=1';
export const WORKLOAD_METRICS_SUMMARY_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-workload-1/rancher-workload?orgId=1';

export const useDefaultWorkloadResourceTabs = async(resource: any, hide: Hide) => {
  const cronJobsTab = hide.cronJobs ? undefined : useFetchDefaultCronJobsProps(resource);
  const podsTab = hide.pods ? undefined : useFetchDefaultPodsTabProps(resource);
  const metricsTab = hide.metrics ? undefined : useFetchDefaultWorkloadMetricsProps(resource);
  const projectMetricsTab = hide.projectMetrics ? undefined : useFetchDefaultWorkloadProjectMetricsProps({});
  const servicesTab = hide.services ? undefined : useFetchDefaultServicesProps(resource);
  const ingressesTab = hide.ingresses ? undefined : useFetchDefaultIngressesProps();

  const awaitedValues: any = await allHash({
    cronJobsTab, podsTab, metricsTab, projectMetricsTab, servicesTab, ingressesTab
  });

  return {
    cronJobsTab:       awaitedValues.cronJobsTab,
    podsTab:           awaitedValues.podsTab,
    metricsTab:        awaitedValues.metricsTab,
    projectMetricsTab: awaitedValues.projectMetricsTab,
    servicesTab:       awaitedValues.servicesTab,
    ingressesTab:      awaitedValues.ingressesTab
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
  <ResourceTabs
    :related-resources="relatedResources"
    :value="targetResource"
    :schema="schema"
  >
    <CronJobsTab
      v-if="cronJobsTab"
      v-bind="cronJobsTab"
      :weight="4"
    />
    <ResourceTableTab
      v-if="podsTab"
      v-bind="podsTab"
      :weight="4"
    />
    <MetricsTab
      v-if="metricsTab"
      v-bind="metricsTab"
      :weight="3"
    />
    <MetricsTab
      v-if="projectMetricsTab"
      v-bind="projectMetricsTab"
      :weight="3"
    />
    <ServicesTab
      v-if="servicesTab"
      v-bind="servicesTab"
      :weight="3"
    />
    <IngressesTab
      v-if="ingressesTab"
      v-bind="ingressesTab"
      :weight="2"
    />
  </ResourceTabs>
</template>

<style lang='scss' scoped>

</style>
