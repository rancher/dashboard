<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import { useDefaultTitleBarProps } from '@shell/components/Resource/Detail/TitleBar/composables';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import { useDefaultMetadataProps } from '@shell/components/Resource/Detail/Metadata/composables';
import { CONFIG_MAP } from '@shell/config/types';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import ConfigMapDataTab from '@shell/components/Resource/Detail/ResourceTabs/ConfigMapDataTab/index.vue';
import { useGetConfigMapDataTabProps } from '@shell/components/Resource/Detail/ResourceTabs/ConfigMapDataTab/composables';
import { useStore } from 'vuex';
import { computed } from 'vue';

const store = useStore();
const props = defineProps<{
  value: any;
}>();

const secret = props.value;
const schema = computed(() => store.getters['cluster/schemaFor'](CONFIG_MAP));
const titleBarProps = useDefaultTitleBarProps(secret);
const metadataProps = useDefaultMetadataProps(secret);
const configMapDataTabProps = useGetConfigMapDataTabProps(secret);
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
        :value="secret"
        :schema="schema"
      >
        <ConfigMapDataTab
          v-bind="configMapDataTabProps"
        />
      </ResourceTabs>
    </template>
  </DetailPage>
</template>
