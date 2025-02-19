<script>
import SortableTable from '@shell/components/SortableTable';

export default {
  name: 'FleetResources',

  components: { SortableTable },

  props: {
    value: {
      type:     Object,
      required: true,
    },
    clusterId: {
      type:     String,
      required: false,
      default:  null,
    },
  },

  computed: {
    computedResources() {
      return this.value.resourcesStatuses;
    },

    resourceHeaders() {
      return [
        {
          name:      'state',
          value:     'state',
          label:     'State',
          sort:      'stateSort',
          formatter: 'BadgeStateFormatter',
          width:     100,
        },
        {
          name:  'cluster',
          value: 'clusterName',
          sort:  ['clusterName', 'stateSort'],
          label: 'Cluster',
        },
        {
          name:  'apiVersion',
          value: 'apiVersion',
          sort:  'apiVersion',
          label: 'API Version',
        },
        {
          name:  'kind',
          value: 'kind',
          sort:  'kind',
          label: 'Kind',
        },
        {
          name:      'name',
          value:     'name',
          sort:      'name',
          label:     'Name',
          formatter: 'LinkDetail',
        },
        {
          name:  'namespace',
          value: 'namespace',
          sort:  'namespace',
          label: 'Namespace',
        },
      ];
    },
  }
};
</script>

<template>
  <SortableTable
    :rows="computedResources"
    :headers="resourceHeaders"
    :table-actions="false"
    :row-actions="false"
    key-field="tableKey"
    default-sort-by="state"
    :paged="true"
  />
</template>
