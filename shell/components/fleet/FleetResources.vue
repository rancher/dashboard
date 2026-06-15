<script>
import ResourceTable from '@shell/components/ResourceTable';
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

  components: { ResourceTable },

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
    search: {
      type:    Boolean,
      default: true
    },
  },

  computed: {
    groupOptions() {
      return [{
        tooltipKey: 'resourceTable.groupBy.none',
        icon:       'icon-list-flat',
        value:      'none',
      }, {
        tooltipKey: 'resourceTable.groupBy.cluster',
        hideColumn: 'provider',
        icon:       'icon-folder',
        value:      'clusterId',
        field:      'clusterId',
      }];
    },
    computedResources() {
      const resources = (this.rows || []).map((r) => ({
        tableKey: r.key,
        ...stateDisplayProperties(r.state),
        ...r,
      }));

      if (this.clusterId) {
        return resources.filter((r) => r.clusterId === this.clusterId);
      }

      return resources;
    },
    resourceHeaders() {
      const out = [
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

      if (!this.clusterId) {
        out.splice(3, 0, {
          name:  'cluster',
          value: 'clusterName',
          sort:  ['clusterName', 'stateSort'],
          label: 'Cluster',
        });
      }

      return out;
    },
  }
};
</script>

<template>
  <ResourceTable
    :rows="computedResources"
    :headers="resourceHeaders"
    :table-actions="false"
    :row-actions="false"
    :search="search"
    :group-options="groupOptions"
    key-field="tableKey"
    default-sort-by="state"
  >
    <!-- Pass down templates provided by the caller -->
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
  </ResourceTable>
</template>
