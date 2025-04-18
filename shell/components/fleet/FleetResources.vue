<script>
import SortableTable from '@shell/components/SortableTable';
import { colorForState, stateDisplay, stateSort } from '@shell/plugins/dashboard-store/resource-class';

function stateDisplayProperties(state) {
  const color = colorForState(state).replace('text-', 'bg-');
  const display = stateDisplay(state);

  return {
    stateBackground: color,
    stateDisplay:    display,
    stateSort:       stateSort(color, display),
  };
}

export default {
  name: 'FleetResources',

  components: { SortableTable },

  props: {
    rows: {
      type:     Array,
      required: true,
    },
    clusterId: {
      type:     String,
      required: false,
      default:  null,
    },
  },

  computed: {
    resources() {
      return (this.rows || []).map((r) => ({
        tableKey: r.key,
        ...stateDisplayProperties(r.state),
        ...r,
      }));
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
    :rows="resources"
    :headers="resourceHeaders"
    :table-actions="false"
    :row-actions="false"
    key-field="tableKey"
    default-sort-by="state"
    :paged="true"
  />
</template>
