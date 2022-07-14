<script>
import { colorForState, stateDisplay, stateSort } from '@shell/plugins/dashboard-store/resource-class';
import SortableTable from '@shell/components/SortableTable';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';
import { randomStr } from '@shell/utils/string';

export default {
  name: 'FleetResources',

  components: { SortableTable },

  props: {
    value: {
      type:     Object,
      required: true,
    }
  },

  computed: {
    computedResources() {
      const clusters = this.value.targetClusters || [];
      const resources = this.value.status?.resources || [];
      const out = [];

      for ( const r of resources ) {
        let namespacedName = r.name;

        if ( r.namespace ) {
          namespacedName = `${ r.namespace }:${ r.name }`;
        }

        for ( const c of clusters ) {
          let state = r.state;
          const perEntry = r.perClusterState?.find(x => x.clusterId === c.id );
          const tooMany = r.perClusterState?.length >= 10 || false;

          if ( perEntry ) {
            state = perEntry.state;
          } else if ( tooMany ) {
            state = 'Unknown';
          }

          const color = colorForState(state).replace('text-', 'bg-');
          const display = stateDisplay(state);

          const detailLocation = {
            name:   `c-cluster-product-resource${ r.namespace ? '-namespace' : '' }-id`,
            params: {
              product:   EXPLORER,
              cluster:   c.metadata.labels[FLEET_ANNOTATIONS.CLUSTER_NAME],
              resource:  r.type,
              namespace: r.namespace,
              id:        r.name,
            }
          };

          out.push({
            key:             `${ r.id }-${ c.id }-${ r.type }-${ r.namespace }-${ r.name }`,
            tableKey:        `${ r.id }-${ c.id }-${ r.type }-${ r.namespace }-${ r.name }-${ randomStr(8) }`,
            kind:            r.kind,
            apiVersion:      r.apiVersion,
            type:            r.type,
            id:              r.id,
            namespace:       r.namespace,
            name:            r.name,
            clusterId:       c.id,
            clusterName:     c.nameDisplay,
            state,
            stateBackground: color,
            stateDisplay:    display,
            stateSort:       stateSort(color, display),
            namespacedName,
            detailLocation,
          });
        }
      }

      return out;
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
    key-field="tableKey"
    default-sort-by="state"
    :paged="true"
  />
</template>
