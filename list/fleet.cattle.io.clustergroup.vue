<script>
import ResourceTable from '@/components/ResourceTable';
import { get } from '@/utils/object';

import {
  AGE,
  STATE,
  NAME,
  WORKSPACE, FLEET_SUMMARY
} from '@/config/table-headers';
import { removeObject } from '@/utils/array';

export default {
  name:       'ListClusterGroup',
  components: { ResourceTable },

  props: {
    schema: {
      type:     Object,
      required: true,
    },

    rows: {
      type:     Array,
      required: true,
    },
  },

  computed: {
    headers() {
      const out = [
        STATE,
        NAME,
        WORKSPACE,
        {
          name:     'clusters',
          labelKey: 'tableHeaders.clustersReady',
          value:    'status.display.readyClusters',
          sort:     'status.display.readyClusters',
          search:   ['status.nonReadyClusterCount', 'status.clusterCount'],
          width:    100,
        },
        FLEET_SUMMARY,
        AGE
      ];

      if ( this.groupBy || !this.groupable ) {
        removeObject(out, WORKSPACE);
      }

      return out;
    },
  },

  methods: { get },
};
</script>

<template>
  <ResourceTable
    v-bind="$attrs"
    :schema="schema"
    :headers="headers"
    :rows="rows"
    :group-by="groupBy"
    :paging="true"
    paging-label="sortableTable.paging.resource"
    :paging-params="pagingParams"
    key-field="_key"
    v-on="$listeners"
  >
    <template #cell:clusters="{row}">
      <span v-if="row.status.nonReadyClusterCount" class="text-warning">{{ row.status.clusterCount - row.status.nonReadyClusterCount }}/{{ row.status.clusterCount }}</span>
      <span v-else>{{ row.status.clusterCount }}</span>
    </template>
  </ResourceTable>
</template>
