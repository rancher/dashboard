<script>
import ResourceTable from '@/components/ResourceTable';
import { get } from '@/utils/object';

import {
  STATE,
  NAMESPACE_NAME,
} from '@/config/table-headers';

export default {
  name:       'ListCluster',
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
      return [
        STATE,
        NAMESPACE_NAME,
        {
          name:      'bundlesReady',
          labelKey:  'tableHeaders.bundlesReady',
          value:     'status.display.readyBundles',
          sort:      'status.summary.ready',
          search:    false,
        },
        {
          name:      'nodesReady',
          labelKey:  'tableHeaders.nodesReady',
          value:     'status.display.readyBundles',
          sort:      'status.summary.ready',
          search:    false,
        },
        {
          name:          'lastUpdated',
          labelKey:      'tableHeaders.lastUpdated',
          value:         'status.agent.lastSeen',
          sort:          'status.agent.lastSeen',
          search:        false,
          formatter:     'LiveDate',
          formatterOpts: { addSuffix: true },
          width:         120,
          align:         'right'
        },
      ];
    },
  },

  methods: { get },

};
</script>

<template>
  <div>
    <ResourceTable
      v-bind="$attrs"
      :headers="headers"
      :rows="rows"
      :schema="schema"
    >
      <template #cell:bundlesReady="{row}">
        <span v-if="row.bundleInfo.unready" class="text-warning">{{ row.bundleInfo.ready }}/{{ row.bundleInfo.total }}</span>
        <span v-else>{{ row.bundleInfo.total }}</span>
      </template>

      <template #cell:nodesReady="{row}">
        <span v-if="row.nodeInfo.unready" class="text-warning">{{ row.nodeInfo.ready }}/{{ row.nodeInfo.total }}</span>
        <span v-else>{{ row.nodeInfo.total }}</span>
      </template>
    </ResourceTable>
  </div>
</template>

<style lang="scss" scoped>
  ::v-deep .sub-row TD {
    padding: 5px 0;
  }

  ::v-deep .sub-spacer TD {
    padding: 0;
    height: 0;
  }
</style>
