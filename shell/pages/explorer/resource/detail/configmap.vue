<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import { useDefaultTitleBarProps } from '@shell/components/Resource/Detail/TitleBar/composables';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import { useDefaultMetadataProps } from '@shell/components/Resource/Detail/Metadata/composables';
import { CONFIG_MAP } from '@shell/config/types';
import { useFetchResourceWithId, useResourceIdentifiers } from '@shell/composables/resources';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import ConfigMapDataTab from '@shell/components/Resource/Detail/ResourceTabs/ConfigMapDataTab/index.vue';
import { useGetConfigMapDataTabProps } from '@shell/components/Resource/Detail/ResourceTabs/ConfigMapDataTab/composables';

const { id, schema } = useResourceIdentifiers(CONFIG_MAP);
const configMap = await useFetchResourceWithId(CONFIG_MAP, id);
const titleBarProps = useDefaultTitleBarProps(configMap);
const metadataProps = useDefaultMetadataProps(configMap);
const configMapDataTabProps = useGetConfigMapDataTabProps(configMap);
</script>

<template>
  <DetailPage>
    <template #top-area>
      <TitleBar
        v-bind="titleBarProps"
      />
      <Metadata
        class="mmt-6"
        v-bind="metadataProps"
      />
    </template>
    <template #bottom-area>
      <ResourceTabs
        :value="configMap"
        :schema="schema"
      >
        <ConfigMapDataTab
          v-bind="configMapDataTabProps"
        />
      </ResourceTabs>
    </template>
  </DetailPage>
</template>
