<script>
import CreateEditView from '@/mixins/create-edit-view';
import VStack from '@/components/Layout/Stack/VStack';
import Tab from '@/components/Tabbed/Tab';
import KeyValue from '@/components/form/KeyValue';
import ResourceTabs from '@/components/form/ResourceTabs';

import {
  DOWNLOAD,
  KEY,
  VALUE,
  STATE,
  NAME,
  SIMPLE_SCALE,
  IMAGE,
  AGE,
} from '@/config/table-headers';

export default {
  name:       'DetailConfigMap',
  components: {
    KeyValue,
    ResourceTabs,
    Tab,
    VStack
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    const valuesTableHeaders = [
      {
        ...KEY, sort: false, width: 400
      },
      { ...VALUE, sort: false },
    ];

    return {
      valuesTableHeaders,
      binaryValuesTableHeaders: [
        ...valuesTableHeaders,
        DOWNLOAD
      ],
      relatedWorkloadsHeaders: [
        STATE,
        NAME,
        SIMPLE_SCALE,
        IMAGE,
        AGE
      ]
    };
  },

  computed: {
    valuesTableRows() {
      return Object.entries(this.value.data || {}).map(kvp => ({
        key:   kvp[0],
        value: kvp[1]
      }));
    },

    binaryValuesTableRows() {
      return Object.entries(this.value.binaryData || {}).map(kvp => ({
        key:   kvp[0],
        value: `${ kvp[1].length } byte${ kvp[1].length !== 1 ? 's' : '' }`
      }));
    },

    relatedWorkloadsRows() {
      return [];
    },
  },
};
</script>

<template>
  <VStack class="config-map">
    <KeyValue
      key="data"
      v-model="value.data"
      :mode="mode"
      :title="t('configmapPage.data.title')"
      :initial-empty-row="true"
    />
    <div class="spacer"></div>
    <ResourceTabs v-model="value" :mode="mode">
      <template #before>
        <Tab name="binary-data" :label="t('configmapPage.tabs.binaryData.label')">
          <KeyValue
            key="binaryData"
            v-model="value.binaryData"
            :protip="false"
            :mode="mode"
            :add-allowed="false"
            :read-accept="'*'"
            :read-multiple="true"
            :value-binary="true"
            :value-base64="true"
            :value-can-be-empty="true"
            :initial-empty-row="false"
          />
        </Tab>
      </template>
    </ResourceTabs>
  </VStack>
</template>

<style lang="scss" scoped>
.detail-top {
  margin-bottom: 50px;
}
</style>
