<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import { CONFIG_MAP } from '@shell/config/types';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import ConfigMapDataTab from '@shell/components/Resource/Detail/ResourceTabs/ConfigMapDataTab/index.vue';
import { useGetConfigMapDataTabProps } from '@shell/components/Resource/Detail/ResourceTabs/ConfigMapDataTab/composables';
import { useStore } from 'vuex';
import { computed } from 'vue';
import Masthead from '@shell/components/Resource/Detail/Masthead/index.vue';
import { useDefaultMastheadProps } from '@shell/components/Resource/Detail/Masthead/composable';

const store = useStore();
const props = defineProps<{
  value: any;
}>();

const configmap = props.value;
const schema = computed(() => store.getters['cluster/schemaFor'](CONFIG_MAP));
const defaultMastheadProps = useDefaultMastheadProps(configmap);
const configMapDataTabProps = useGetConfigMapDataTabProps(configmap);
</script>

<template>
  <DetailPage>
    <template #top-area>
      <Masthead v-bind="defaultMastheadProps" />
    </template>
    <template #bottom-area>
      <ResourceTabs
        :value="configmap"
        :schema="schema"
      >
        <ConfigMapDataTab
          v-bind="configMapDataTabProps"
        />
      </ResourceTabs>
    </template>
  </DetailPage>
</template>
