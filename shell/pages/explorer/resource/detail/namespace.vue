<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import { useDefaultTitleBarData } from '@shell/components/Resource/Detail/TitleBar/composable';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import { useBasicMetadata } from '@shell/components/Resource/Detail/Metadata/composables';
import { NAMESPACE } from '@shell/config/types';
import { useLiveDate, useProject } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/composable';
import { useFetchResourceWithId, useResourceIdentifiers } from '@shell/composables/resources';
import { computed } from 'vue';
import { useFetchRelatedResourcesTab } from '@shell/components/RelatedResources.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import ResourcesTab, { useFetchDefaultResourcesProps } from '@shell/components/Resource/Detail/ResourceTabs/ResourcesTab/index.vue';
import ResourceTableTab from '@shell/components/Resource/Detail/ResourceTabs/ResourceTableTab/index.vue';
import { useFetchDefaultWorkloadTabProps } from '@shell/components/Resource/Detail/ResourceTabs/ResourceTableTab/composables';

const { id, schema } = useResourceIdentifiers(NAMESPACE);
const namespace = await useFetchResourceWithId(NAMESPACE, id);
const titleBarProps = useDefaultTitleBarData(namespace);

const relatedResourcesTab = await useFetchRelatedResourcesTab(namespace);

const { labels, annotations } = useBasicMetadata(namespace);
const identifyingInformation = computed(() => {
  return [
    useProject(namespace).value,
    useLiveDate(namespace).value
  ];
});

const namespaceResourceCounts = await useFetchDefaultResourcesProps(namespace);
const workloadTabProps = await useFetchDefaultWorkloadTabProps(namespace.id);
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
        :related-resources="relatedResourcesTab"
        :value="namespace"
        :schema="schema"
      >
        <ResourcesTab
          :namespaced-resource-counts="namespaceResourceCounts"
          :weight="0"
        />
        <ResourceTableTab
          v-bind="workloadTabProps"
          :weight="1"
        />
      </ResourceTabs>
    </template>
  </DetailPage>
</template>
