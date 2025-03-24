<script>
import SortableTable from '@shell/components/SortableTable';

export default {
  name: 'FleetResources',

  components: { SortableTable },

  emits: ['rowClick'],

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
    selectedRowClick: {
      type:    Object,
      default: null
    },
    search: {
      type:    Boolean,
      default: true
    },
  },

  computed: {
    computedResources() {
      const resources = this.value.resourcesStatuses;

      if (this.clusterId) {
        return resources.filter((r) => r.clusterId === this.clusterId);
      }

      return resources;
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
          name:      'name',
          value:     'name',
          sort:      'name',
          label:     'Name',
          formatter: 'LinkDetail',
        },
        {
          name:  'kind',
          value: 'kind',
          sort:  'kind',
          label: 'Kind',
        },
        {
          name:  'cluster',
          value: 'clusterName',
          sort:  ['clusterName', 'stateSort'],
          label: 'Cluster',
        },
        {
          name:  'namespace',
          value: 'namespace',
          sort:  'namespace',
          label: 'Namespace',
        },
        {
          name:  'apiVersion',
          value: 'apiVersion',
          sort:  'apiVersion',
          label: 'API Version',
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
    :search="search"
    key-field="tableKey"
    default-sort-by="state"
    :paged="true"
    :selected-row-click="selectedRowClick"
    @rowClick="$emit('rowClick', $event)"
  >
    <template
      v-for="(_, slot) of $slots"
      v-slot:[slot]="scope"
      :key="slot"
    >
      <slot
        :name="slot"
        v-bind="scope"
      />
    </template>
  </SortableTable>
</template>
