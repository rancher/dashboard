<script>
import { DESCRIPTION } from '@/config/labels-annotations';
import CreateEditView from '@/mixins/create-edit-view';
import DetailTop from '@/components/DetailTop';
import Labels from '@/components/form/Labels';
import SortableTable from '@/components/SortableTable';
import VStack from '@/components/Layout/Stack/VStack';
import { downloadFile } from '@/utils/download';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';

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
    DetailTop,
    Labels,
    SortableTable,
    Tab,
    Tabbed,
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

    detailTopColumns() {
      const { metadata = {} } = this.value;
      const { annotations = {} } = metadata;

      return [
        {
          title:   'Description',
          content: annotations[DESCRIPTION]
        },
        {
          title:   'Namespace',
          content: metadata.namespace
        }
      ];
    }
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
    <DetailTop class="detail-top" :columns="detailTopColumns" />
    <div>
      <h2>
        Related Workloads
      </h2>
      <SortableTable
        key-field="_key"
        :headers="relatedWorkloadsHeaders"
        :rows="relatedWorkloadsRows"
        :row-actions="false"
        :search="false"
        no-rows-key="generic.comingSoon"
      />
    </div>
    <Tabbed default-tab="values">
      <Tab name="values" label="Values">
        <SortableTable
          key-field="_key"
          :headers="valuesTableHeaders"
          :rows="valuesTableRows"
          :row-actions="false"
          :search="false"
          :table-actions="false"
          :top-divider="false"
          :emphasized-body="false"
          :body-dividers="true"
        />
      </Tab>
      <Tab name="binary-values" label="Binary Values">
        <SortableTable
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
      <Tab label="Labels and Annotations" name="labelsAndAnnotations">
        <Labels :spec="value" :mode="mode" />
      </Tab>
    </Tabbed>
  </VStack>
</template>

<style lang="scss" scoped>
.detail-top {
  margin-bottom: 50px;
}
</style>
