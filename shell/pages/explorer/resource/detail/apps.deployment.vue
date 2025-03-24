<script setup lang="ts">
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import SpacedRow from '@shell/components/Resource/Detail/SpacedRow.vue';
import CpuUsageCard from '@shell/components/Resource/Detail/Card/CpuUsageCard.vue';
import MemoryUsageCard from '@shell/components/Resource/Detail/Card/MemoryUsageCard.vue';
import PodUsageCard from '@shell/components/Resource/Detail/Card/PodUsageCard.vue';
import PodsCard from '@shell/components/Resource/Detail/Card/PodsCard/index.vue';
import ResourcesCard from '@shell/components/Resource/Detail/Card/ResourcesCard.vue';
import InsightsCard from '@shell/components/Resource/Detail/Card/InsightsCard.vue';
import WorkloadResourceTabs, { fetchDefaultWorkloadResourceTabs } from '@shell/components/Resource/Detail/ResourceTabs/WorkloadResourceTabs/index.vue';
import TitleBar, { extractDefaultTitleBarData } from '@shell/components/Resource/Detail/TitleBar.vue';
import Metadata, { extractDefaultMetadata } from '@shell/components/Resource/Detail/Metadata/index.vue';
import { WORKLOAD_TYPES } from '@shell/config/types';
import { useI18n } from '@shell/composables/useI18n';

const store = useStore();
const route = useRoute();
const i18n = useI18n(store);

const fetch = async() => {
  const id = `${ route.params.namespace }/${ route.params.id }`;

  const deployment = await store.dispatch('cluster/find', { type: WORKLOAD_TYPES.DEPLOYMENT, id });

  return {
    titleBar:     extractDefaultTitleBarData(deployment, route, store),
    metadata:     extractDefaultMetadata(deployment, i18n),
    resourceTabs: await fetchDefaultWorkloadResourceTabs(store, i18n)
  };
};

const data = ref(await fetch());

</script>
<template>
  <DetailPage>
    <template #top-area>
      <TitleBar
        :resourceTypeLabel="data.titleBar.resourceTypeLabel"
        :resourceTo="data.titleBar.resourceTo"
        :resourceName="data.titleBar.resourceName"
        :description="data.titleBar.description"
        :badge="data.titleBar.badge"
      />
      <Metadata
        class="mmt-6"
        :identifying-information="data.metadata.identifyingInformation"
        :labels="data.metadata.labels"
        :annotations="data.metadata.annotations"
      />
    </template>
    <template #middle-area>
      <SpacedRow>
        <CpuUsageCard />
        <MemoryUsageCard />
        <PodUsageCard />
      </SpacedRow>
      <SpacedRow class="mmt-6">
        <PodsCard />
        <ResourcesCard />
        <InsightsCard />
      </SpacedRow>
    </template>
    <template #bottom-area>
      <WorkloadResourceTabs
        :cronJobsTab="data.resourceTabs.cronJobsTab"
        :podsTab="data.resourceTabs.podsTab"
        :metricsTab="data.resourceTabs.metricsTab"
        :projectMetricsTab="data.resourceTabs.projectMetricsTab"
        :servicesTab="data.resourceTabs.servicesTab"
        :ingressesTab="data.resourceTabs.ingressesTab"
      />
    </template>
  </DetailPage>
</template>
