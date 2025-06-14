<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import { useDefaultTitleBarData } from '@shell/components/Resource/Detail/TitleBar/composable';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import { useDefaultMetadata } from '@shell/components/Resource/Detail/Metadata/composables';
import { POD } from '@shell/config/types';
import { useFetchResourceWithId, useResourceIdentifiers } from '@shell/composables/resources';
import { computed } from 'vue';
import { useFetchRelatedResourcesTab } from '@shell/components/RelatedResources.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import ContainersTab from '@shell/components/Resource/Detail/ResourceTabs/ContainersTab/index.vue';
import MetricsTab, { useFetchDefaultPodMetricsTabProps } from '@shell/components/Resource/Detail/ResourceTabs/MetricsTab/index.vue';
import { usePodIp, useWorkload, useNode } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/composable';

const { id, schema } = useResourceIdentifiers(POD);
const pod = await useFetchResourceWithId(POD, id);
const titleBarProps = useDefaultTitleBarData(pod);

const relatedResources = await useFetchRelatedResourcesTab(pod);

const additionalIdentifyingInformation = computed(() => {
  const rows: any[] = [
    usePodIp(pod).value,
    pod.value.workloadRef ? useWorkload(pod).value : null,
    pod.value.spec.nodeName ? useNode(pod).value : null,
  ];

  return rows.filter((r) => r);
});

const { labels, annotations, identifyingInformation } = useDefaultMetadata(pod, additionalIdentifyingInformation);

const metricsTab = useFetchDefaultPodMetricsTabProps(pod);
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
    <template #bottom-area>
      <ResourceTabs
        :value="pod"
        :schema="schema"
        :related-resources="relatedResources"
      >
        <ContainersTab
          :pod="pod"
          :weight="1"
        />
        <MetricsTab
          v-bind="metricsTab"
          :weight="0"
        />
      </ResourceTabs>
    </template>
  </DetailPage>
</template>
