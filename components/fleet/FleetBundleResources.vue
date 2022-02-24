<script>
import { colorForState, stateDisplay, stateSort } from '@/plugins/steve/resource-class';
import SortableTable from '@/components/SortableTable';

export default {
  name: 'FleetBundleResources',

  components: { SortableTable },

  props: {
    value: {
      type:     Array,
      default:  () => [],
    }
  },

  computed: {
    computedResources() {
      return this.value.map((item) => {
        const { state } = item;
        const color = colorForState(state).replace('text-', 'bg-');
        const display = stateDisplay(state);

        return {
          ...item,
          stateBackground: color,
          stateDisplay:    display,
          stateSort:       stateSort(color, display),
        };
      });
    },

    resourceHeaders() {
      return [
        {
          name:          'state',
          value:         'state',
          label:         'State',
          sort:          'stateSort',
          formatter:     'BadgeStateFormatter',
          width:         100,
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
    key-field="key"
    default-sort-by="state"
    :paged="true"
  />
</template>
