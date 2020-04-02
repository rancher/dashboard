<script>
import { get } from '../utils/object';
import { VALUE } from '../config/table-headers';
import createEditView from '@/mixins/create-edit-view';
import DetailTop from '@/components/DetailTop';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import SortableTable from '@/components/SortableTable';

export default {
  components: {
    DetailTop,
    Tabbed,
    Tab,
    SortableTable
  },
  mixins:     [createEditView],
  computed:   {
    detailTopColumns() {
      return [
        {
          title:   'Namespace',
          content: get(this.value, 'metadata.namespace')
        },
        {
          title:   'Image',
          content: this.value.spec.containers[0].image
        },
        {
          title:   'Workload',
          content: this.value.metadata.ownerReferences[0].name
        },
        {
          title:   'Pod IP',
          content: this.value.status.podIP
        },
        {
          title: 'Node',
          name:  'node'
        },
        {
          title:   'Pod Restarts',
          content: (this.value?.status?.containerStatuses || [])[0]?.restartCount
        },
        {
          title:   'Created',
          content: this.value?.metadata?.creationTimestamp
        }
      ];
    },

    KVHeaders() {
      return [{
        label:  'Key', name:   'keys', value:  'key', sort:  'key'
      }, VALUE];
    },

    labels() {
      const out = [];
      const { labels = {} } = this.value.metadata;

      for (const key in labels) {
        out.push({
          key,
          value: labels[key]
        });
      }

      return out;
    },
    annotations() {
      const out = [];
      const { annotations = {} } = this.value.metadata;

      for (const key in annotations) {
        out.push({
          key,
          value: annotations[key]
        });
      }

      return out;
    },

  }
};
</script>

<template>
  <div>
    <DetailTop :columns="detailTopColumns">
      <template v-slot:node>
        <span> {{ value.status.hostIP }} </span>
      </template>
    </DetailTop>

    <Tabbed default-tab="labels">
      <Tab label="Labels" name="labels">
        <SortableTable :rows="labels" :headers="KVHeaders" key-field="value" :search="false" :table-actions="false" />
      </Tab>
      <Tab label="Annotations" name="annotations">
        <SortableTable :rows="annotations" :headers="KVHeaders" key-field="value" :search="false" :table-actions="false" />
      </Tab>
    </Tabbed>
  </div>
</template>
