<script setup lang="ts">
import { useStore } from 'vuex';
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import SpacedRow from '@shell/components/Resource/Detail/SpacedRow.vue';
import ResourceUsage from '@shell/components/Resource/Detail/Card/ResourceUsageCard/index.vue';
import * as usageComposeables from '@shell/components/Resource/Detail/Card/ResourceUsageCard/composable';
import Top from '@shell/components/Resource/Detail/TitleBar/Top.vue';
import Title from '@shell/components/Resource/Detail/TitleBar/Title.vue';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import { useI18n } from '@shell/composables/useI18n';

const store = useStore();
const { t } = useI18n(store);

const cpuProps = usageComposeables.useCpuUsageCardDefaultProps(null);
const memoryProps = usageComposeables.useMemoryUsageCardDefaultProps(null);
const podsProps = usageComposeables.usePodUsageCardDefaultProps(null);

</script>
<template>
  <DetailPage>
    <template #top-area>
      <Top>
        <Title>
          {{ t('clusterIndexPage.header') }}
        </Title>
      </Top>
      <Metadata
        class="mmt-6"
        :identifying-information="identifyingInformation"
        :labels="labels"
        :annotations="annotations"
      />
    </template>
    <template #middle-area>
      <SpacedRow>
        <ResourceUsage v-bind="cpuProps" />
        <ResourceUsage v-bind="memoryProps" />
        <ResourceUsage v-bind="podsProps" />
      </SpacedRow>
    </template>
    <template #bottom-area />
  </DetailPage>
</template>
