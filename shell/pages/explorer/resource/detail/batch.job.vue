<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import SpacedRow from '@shell/components/Resource/Detail/SpacedRow.vue';
import PodsCard from '@shell/components/Resource/Detail/Card/PodsCard/index.vue';
import StateCard from '@shell/components/Resource/Detail/Card/StateCard/index.vue';
import { useDefaultWorkloadResources, useDefaultWorkloadInsightsCardProps } from '@shell/components/Resource/Detail/Card/StateCard/composables';
import WorkloadResourceTabs, { useDefaultWorkloadResourceTabs } from '@shell/components/Resource/Detail/ResourceTabs/WorkloadResourceTabs/index.vue';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import { useDefaultTitleBarData } from '@shell/components/Resource/Detail/TitleBar/composable';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import { useDefaultMetadata } from '@shell/components/Resource/Detail/Metadata/composables';
import { WORKLOAD_TYPES } from '@shell/config/types';
import { useFetchRelatedResourcesTab } from '@shell/components/RelatedResources.vue';
import { useFetchResourceWithId, useResourceIdentifiers } from '@shell/composables/resources';
import { computed } from 'vue';
import { useStarted, useDuration, useImage, useRestarts } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/composable';

const { id, schema } = useResourceIdentifiers(WORKLOAD_TYPES.JOB);
const job = await useFetchResourceWithId(WORKLOAD_TYPES.JOB, id);
const titleBarProps = useDefaultTitleBarData(job);

const resourceTabs = await useDefaultWorkloadResourceTabs(job, {
  cronJobs: true, services: true, ingresses: true, metrics: true, projectMetrics: true
});

const { referredToBy, refersTo } = await useFetchRelatedResourcesTab(job);
const resourceCardProps = useDefaultWorkloadResources(resourceTabs.servicesTab?.services, resourceTabs.ingressesTab?.ingresses, referredToBy, refersTo);
const insightsCardProps = useDefaultWorkloadInsightsCardProps();

const { completionTime, startTime } = job.value.status;
const additionalIdentifyingInformation = computed(() => {
  const rows: any[] = [
    startTime ? useStarted(job).value : null,
    (startTime && completionTime) ? useDuration(job).value : null,
    useImage(job).value,
    useRestarts(job).value
  ];

  return rows.filter((r) => r);
});

const { labels, annotations, identifyingInformation } = useDefaultMetadata(job, additionalIdentifyingInformation);
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
      <SpacedRow class="mmt-6">
        <PodsCard
          :key="job.pods.length"
          :pods="job.pods"
        />
        <StateCard v-bind="resourceCardProps" />
        <StateCard v-bind="insightsCardProps" />
      </SpacedRow>
    </template>
    <template #bottom-area>
      <WorkloadResourceTabs
        :cronJobsTab="resourceTabs.cronJobsTab"
        :podsTab="resourceTabs.podsTab"
        :metricsTab="resourceTabs.metricsTab"
        :projectMetricsTab="resourceTabs.projectMetricsTab"
        :servicesTab="resourceTabs.servicesTab"
        :ingressesTab="resourceTabs.ingressesTab"
        :targetResource="job"
        :schema="schema"
      />
    </template>
  </DetailPage>
</template>
