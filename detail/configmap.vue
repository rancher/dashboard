<script>
import CreateEditView from '@/mixins/create-edit-view';
import SortableTable from '@/components/SortableTable';
import VStack from '@/components/Layout/Stack/VStack';
import { downloadFile } from '@/utils/download';
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
    SortableTable,
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
        ...KEY, sort:  false, width: 400
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

  methods: {
    onDownloadClick(file, ev) {
      ev.preventDefault();
      downloadFile(file.key, file.value, 'application/octet-stream');
    }
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
    <ResourceTabs v-model="value" :mode="mode">
      <template #before>
        <Tab name="binary-data" :label="t('configmapPage.tabs.binaryData.label')">
          <SortableTable
            class="binary-data"
            key-field="_key"
            :headers="binaryValuesTableHeaders"
            :rows="binaryValuesTableRows"
            :row-actions="false"
            :search="false"
            :table-actions="false"
            :top-divider="false"
            :emphasized-body="false"
            :body-dividers="true"
          >
            <template #col:download="{row}">
              <td data-title="Download:" align="right" class="col-click-expand">
                <a href="#" @click="onDownloadClick(row, $event)">Download</a>
              </td>
            </template>
          </SortableTable>
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
