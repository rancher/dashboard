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
import TitleBar, { extractDefaultTitleBarData } from '@shell/components/Resource/Detail/TitleBar.vue';
import Metadata, { extractDefaultMetadata } from '@shell/components/Resource/Detail/Metadata/index.vue';
import { WORKLOAD_TYPES } from '@shell/config/types';

const store = useStore();
const route = useRoute();

const fetch = async() => {
  const id = `${ route.params.namespace }/${ route.params.id }`;

  const cronJob = await store.dispatch('cluster/find', { type: WORKLOAD_TYPES.CRON_JOB, id });

  return {
    titleBar: extractDefaultTitleBarData(cronJob),
    metadata: extractDefaultMetadata(cronJob)
  };
};

const data = ref(await fetch());

</script>
<template>
  <DetailPage>
    <template #top-area>
      <TitleBar
        resourceTypeLabel="CronJob"
        resourceTo="#"
        :resourceName="data.titleBar.resourceName"

        description="A CronJob creates Jobs on a repeating schedule."
        :badge="{label: 'Active', color: 'bg-success'}"
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
      <div>Bottom</div>
    </template>
  </DetailPage>
</template>
