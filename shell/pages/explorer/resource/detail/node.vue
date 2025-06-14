<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import { useDefaultTitleBarData } from '@shell/components/Resource/Detail/TitleBar/composable';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import { useBasicMetadata } from '@shell/components/Resource/Detail/Metadata/composables';
import { NODE } from '@shell/config/types';
import {
  useContainerRuntime, useExternalIp, useInternalIp, useOs, useVersion
} from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/composable';
import { useFetchResourceWithId, useResourceIdentifiers } from '@shell/composables/resources';
import { computed } from 'vue';
import { useFetchRelatedResourcesTab } from '@shell/components/RelatedResources.vue';
import { useStore } from 'vuex';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import ComponentHealth from '@shell/components/Resource/Detail/ComponentHealth.vue';
import { useI18n } from '@shell/composables/useI18n';
import { StateColor } from '@shell/utils/style';
import MetricsTab, { useFetchDefaultNodeMetricsTabProps } from '@shell/components/Resource/Detail/ResourceTabs/MetricsTab/index.vue';
import ResourceTableTab from '@shell/components/Resource/Detail/ResourceTabs/ResourceTableTab/index.vue';
import { useGetDefaultNodeInfoTabProps, useGetDefaultImagesTabProps, useFetchDefaultPodsTabProps, useGetDefaultTaintsTabProps } from '@shell/components/Resource/Detail/ResourceTabs/ResourceTableTab/composables';

const store = useStore();
const { t } = useI18n(store);

const { id, schema } = useResourceIdentifiers(NODE);
const node = await useFetchResourceWithId(NODE, id);
const titleBarProps = useDefaultTitleBarData(node);

const relatedResources = await useFetchRelatedResourcesTab(node);

const { labels, annotations } = useBasicMetadata(node);
const identifyingInformation = computed(() => {
  const rows: any[] = [
    node.value.internalIp ? useInternalIp(node).value : null,
    node.value.externalIp ? useExternalIp(node).value : null,
    useVersion(node).value,
    useOs(node).value,
    useContainerRuntime(node).value,
  ];

  return rows.filter((r) => r);
});

const mapToStatus = (isOk: any): StateColor => {
  return isOk ? 'success' : 'error';
};

const components = computed(() => {
  const components = [
    {
      label: t('node.detail.glance.pidPressure'),
      color: mapToStatus(node.value.isPidPressureOk)
    },
    {
      label: t('node.detail.glance.diskPressure'),
      color: mapToStatus(node.value.isDiskPressureOk)
    },
    {
      label: t('node.detail.glance.memoryPressure'),
      color: mapToStatus(node.value.isMemoryPressureOk)
    },
    {
      label: t('node.detail.glance.kubelet'),
      color: mapToStatus(node.value.isKubeletOk)
    }
  ];

  return components;
});

const nodeInfoTabProps = useGetDefaultNodeInfoTabProps(node);
const podsTabProps = await useFetchDefaultPodsTabProps(node);
const imagesTabProps = useGetDefaultImagesTabProps(node);
const taintsTabProps = useGetDefaultTaintsTabProps(node);
const metricsTab = useFetchDefaultNodeMetricsTabProps(node);
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
      <ComponentHealth
        class="mmt-4"
        :components="components"
      />
    </template>
    <template #bottom-area>
      <ResourceTabs
        :value="node"
        :schema="schema"
        :related-resources="relatedResources"
      >
        <ResourceTableTab
          v-bind="podsTabProps"
          :weight="4"
        />
        <MetricsTab
          v-bind="metricsTab"
          :weight="3"
        />
        <ResourceTableTab
          v-bind="nodeInfoTabProps"
          :weight="2"
        />
        <ResourceTableTab
          v-bind="imagesTabProps"
          :weight="1"
        />
        <ResourceTableTab
          v-bind="taintsTabProps"
          :weight="0"
        />
      </ResourceTabs>
    </template>
  </DetailPage>
</template>
