<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import SpacedRow from '@shell/components/Resource/Detail/SpacedRow.vue';
import StateCard from '@shell/components/Resource/Detail/Card/StateCard/index.vue';
import { useDefaultWorkloadResources, useDefaultWorkloadInsightsCardProps } from '@shell/components/Resource/Detail/Card/StateCard/composables';
import WorkloadResourceTabs, { useDefaultWorkloadResourceTabs } from '@shell/components/Resource/Detail/ResourceTabs/WorkloadResourceTabs/index.vue';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import { useDefaultTitleBarData } from '@shell/components/Resource/Detail/TitleBar/composable';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import { useDefaultMetadata } from '@shell/components/Resource/Detail/Metadata/composables';
import { WORKLOAD_TYPES } from '@shell/config/types';
import { useDefaultWorkloadIdentifyingInformation } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/composable';
import { useFetchRelatedResourcesTab } from '@shell/components/RelatedResources.vue';
import { useFetchResourceWithId, useResourceIdentifiers } from '@shell/composables/resources';

const { id, schema } = useResourceIdentifiers(WORKLOAD_TYPES.CRON_JOB);
const cronjob = await useFetchResourceWithId(WORKLOAD_TYPES.CRON_JOB, id);
const titleBarProps = useDefaultTitleBarData(cronjob);

const resourceTabs = await useDefaultWorkloadResourceTabs(cronjob, {
  pods: true, services: true, ingresses: true, metrics: true, projectMetrics: true
});

const relatedResources = await useFetchRelatedResourcesTab(cronjob);
const resourceCardProps = useDefaultWorkloadResources(resourceTabs.servicesTab?.services, resourceTabs.ingressesTab?.ingresses, relatedResources.referredToBy, relatedResources.refersTo);
const insightsCardProps = useDefaultWorkloadInsightsCardProps();

const additionalIdentifyingInformation = useDefaultWorkloadIdentifyingInformation(cronjob);
const { identifyingInformation, labels, annotations } = useDefaultMetadata(cronjob, additionalIdentifyingInformation);
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
        <StateCard v-bind="resourceCardProps" />
        <StateCard v-bind="insightsCardProps" />
      </SpacedRow>
    </template>
    <template #bottom-area>
      <WorkloadResourceTabs
        :related-resources="relatedResources"
        :cron-jobs-tab="resourceTabs.cronJobsTab"
        :pods-tab="resourceTabs.podsTab"
        :metrics-tab="resourceTabs.metricsTab"
        :project-metrics-tab="resourceTabs.projectMetricsTab"
        :services-tab="resourceTabs.servicesTab"
        :ingresses-tab="resourceTabs.ingressesTab"
        :target-resource="cronjob"
        :schema="schema"
      />
    </template>
  </DetailPage>
</template>
