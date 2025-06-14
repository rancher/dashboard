<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import { useDefaultTitleBarData } from '@shell/components/Resource/Detail/TitleBar/composable';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import { useDefaultMetadata } from '@shell/components/Resource/Detail/Metadata/composables';
import { CONFIG_MAP } from '@shell/config/types';
import { useFetchResourceWithId, useResourceIdentifiers } from '@shell/composables/resources';
import { useFetchRelatedResourcesTab } from '@shell/components/RelatedResources.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import ConfigMapDataTab from '@shell/components/Resource/Detail/ResourceTabs/ConfigMapDataTab/index.vue';

const { id, schema } = useResourceIdentifiers(CONFIG_MAP);
const configMap = await useFetchResourceWithId(CONFIG_MAP, id);
const titleBarProps = useDefaultTitleBarData(configMap);

const relatedResources = await useFetchRelatedResourcesTab(configMap);

const { labels, annotations, identifyingInformation } = useDefaultMetadata(configMap);
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
        :value="configMap"
        :schema="schema"
        :related-resources="relatedResources"
      >
        <ConfigMapDataTab
          :configMap="configMap"
          :weight="1"
        />
      </ResourceTabs>
    </template>
  </DetailPage>
</template>
