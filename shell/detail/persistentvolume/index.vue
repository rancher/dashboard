<script setup lang="ts">
import { useStore } from 'vuex';
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import Masthead from '@shell/components/Resource/Detail/Masthead/index.vue';
import { useDefaultMastheadProps } from '@shell/components/Resource/Detail/Masthead/composable';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useBoundPersistentVolumeClaim } from './composables';

const props = defineProps<{ value: any }>();

const store = useStore();
const { t } = useI18n(store);
const pv = props.value;

const defaultMastheadProps = useDefaultMastheadProps(pv);
const { pvcSchema, pvcHeaders, claims } = useBoundPersistentVolumeClaim(pv);
</script>

<template>
  <DetailPage>
    <template #top-area>
      <Masthead v-bind="defaultMastheadProps" />
    </template>
    <template #bottom-area>
      <ResourceTabs :value="pv">
        <Tab
          v-if="pvcSchema"
          name="volume-claim"
          :label="t('persistentVolume.detail.claim.label')"
          :weight="3"
        >
          <p class="caption">
            {{ claims.length ? t('persistentVolume.detail.claim.caption') : t('persistentVolume.detail.claim.none') }}
          </p>
          <ResourceTable
            v-if="claims.length"
            :rows="claims"
            :headers="pvcHeaders"
            key-field="id"
            :schema="pvcSchema"
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
