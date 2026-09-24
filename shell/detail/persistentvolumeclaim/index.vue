<script setup lang="ts">
import { useStore } from 'vuex';
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import Masthead from '@shell/components/Resource/Detail/Masthead/index.vue';
import { useDefaultMastheadProps } from '@shell/components/Resource/Detail/Masthead/composable';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useMountedPods } from './composables';

const props = defineProps<{ value: any }>();

const store = useStore();
const { t } = useI18n(store);
const pvc = props.value;

const defaultMastheadProps = useDefaultMastheadProps(pvc);
const { podSchema, podHeaders, mountedPods } = useMountedPods(pvc);
</script>

<template>
  <DetailPage>
    <template #top-area>
      <Masthead v-bind="defaultMastheadProps" />
    </template>
    <template #bottom-area>
      <ResourceTabs :value="pvc">
        <Tab
          v-if="podSchema"
          name="mounted-pods"
          :label="t('persistentVolumeClaim.detail.pods.label')"
          :weight="3"
        >
          <p class="caption">
            {{ mountedPods.length ? t('persistentVolumeClaim.detail.pods.caption') : t('persistentVolumeClaim.detail.pods.none') }}
          </p>
          <ResourceTable
            v-if="mountedPods.length"
            :rows="mountedPods"
            :headers="podHeaders"
            key-field="id"
            :schema="podSchema"
            :namespaced="false"
            :groupable="false"
            :search="false"
            :table-actions="false"
          />
        </Tab>
      </ResourceTabs>
    </template>
  </DetailPage>
</template>

<style lang="scss" scoped>
.caption {
  margin-bottom: .5em;
}
</style>
