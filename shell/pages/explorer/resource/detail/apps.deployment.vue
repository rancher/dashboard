<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import SpacedRow from '@shell/components/Resource/Detail/SpacedRow.vue';
import PodsCard from '@shell/components/Resource/Detail/Card/PodsCard/index.vue';
import StateCard from '@shell/components/Resource/Detail/Card/StateCard/index.vue';
import { useDefaultWorkloadResources, useDefaultWorkloadInsightsCardProps } from '@shell/components/Resource/Detail/Card/StateCard/composables';
import WorkloadResourceTabs, { useDefaultWorkloadResourceTabs, WORKLOAD_METRICS_DETAIL_URL, WORKLOAD_METRICS_SUMMARY_URL } from '@shell/components/Resource/Detail/ResourceTabs/WorkloadResourceTabs/index.vue';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import { useDefaultTitleBarData } from '@shell/components/Resource/Detail/TitleBar/composable';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import { useDefaultMetadata } from '@shell/components/Resource/Detail/Metadata/composables';
import { WORKLOAD_TYPES } from '@shell/config/types';
import { useDefaultWorkloadIdentifyingInformation } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/composable';
import { useFetchRelatedResourcesTab } from '@shell/components/RelatedResources.vue';
import { useScaling } from '@shell/components/Resource/Detail/Card/PodsCard/composable';
import { useFetchResourceWithId, useResourceIdentifiers } from '@shell/composables/resources';
import { useAllGrafanaDashboardExist } from '@shell/composables/grafana';

const { clusterId, id, schema } = useResourceIdentifiers(WORKLOAD_TYPES.DEPLOYMENT);
const deployment = await useFetchResourceWithId(WORKLOAD_TYPES.DEPLOYMENT, id);
const titleBarProps = useDefaultTitleBarData(deployment);

const allGrafanaDashboardExist = await useAllGrafanaDashboardExist(clusterId, [WORKLOAD_METRICS_DETAIL_URL, WORKLOAD_METRICS_SUMMARY_URL]);
const hideMetrics = !allGrafanaDashboardExist.value;
const resourceTabs = await useDefaultWorkloadResourceTabs(deployment, {
  cronJobs: true, metrics: hideMetrics, projectMetrics: true
});

const relatedResources = await useFetchRelatedResourcesTab(deployment);
const resourceCardProps = useDefaultWorkloadResources(resourceTabs.servicesTab?.services, resourceTabs.ingressesTab?.ingresses, relatedResources.referredToBy, relatedResources.refersTo);
const insightsCardProps = useDefaultWorkloadInsightsCardProps();

const additionalIdentifyingInformation = useDefaultWorkloadIdentifyingInformation(deployment);
const { identifyingInformation, labels, annotations } = useDefaultMetadata(deployment, additionalIdentifyingInformation);
const { scaleUp, scaleDown } = useScaling(deployment.name, () => deployment.scaleUp(), () => deployment.scaleDown());

</script>
<template>
  <DetailPage>
    <template #top-area>
      <TitleBar v-bind="titleBarProps" />
      <Metadata
        class="mmt-6"
        :identifying-information="identifyingInformation"
        :labels="labels"
        :annotations="annotations"
      />
    </template>
    <template #middle-area>
      <SpacedRow>
        <PodsCard
          :pods="deployment.pods"
          :show-scaling="true"
          @increase="scaleUp"
          @decrease="scaleDown"
        />
        <StateCard v-bind="resourceCardProps" />
        <StateCard v-bind="insightsCardProps" />
      </SpacedRow>
    </template>
    <template #bottom-area>
      <WorkloadResourceTabs
        :related-resources="relatedResources"
        :cronJobsTab="resourceTabs.cronJobsTab"
        :podsTab="resourceTabs.podsTab"
        :metricsTab="resourceTabs.metricsTab"
        :projectMetricsTab="resourceTabs.projectMetricsTab"
        :servicesTab="resourceTabs.servicesTab"
        :ingressesTab="resourceTabs.ingressesTab"
        :targetResource="deployment"
        :schema="schema"
      />
    </template>
  </DetailPage>
</template>
