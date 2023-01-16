<script>
import ResourceTable from '@shell/components/ResourceTable';
import { get } from '@shell/utils/object';

import {
  AGE,
  STATE,
  NAME,
  FLEET_SUMMARY
} from '@shell/config/table-headers';

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

    loading: {
      type:     Boolean,
      required: false,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  computed: {
    headers() {
      const out = [
        STATE,
        NAME,
        {
          name:     'clusters',
          labelKey: 'tableHeaders.clustersReady',
          value:    'status.display.readyClusters',
          sort:     'status.display.readyClusters',
          search:   ['status.nonReadyClusterCount', 'status.clusterCount'],
          align:    'center',
          width:    100,
        },
        FLEET_SUMMARY,
        AGE
      ];

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
    :loading="loading"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    key-field="_key"
    v-on="$listeners"
  >
    <template #cell:clusters="{row}">
      <template v-if="row.status">
        <span
          v-if="row.status.nonReadyClusterCount"
          class="text-warning"
        >{{ row.status.clusterCount - row.status.nonReadyClusterCount }}/{{ row.status.clusterCount }}</span>
        <span v-else>{{ row.status.clusterCount }}</span>
      </template>
      <span
        v-else
        class="text-muted"
      >&mdash;</span>
    </template>
  </ResourceTable>
</template>
