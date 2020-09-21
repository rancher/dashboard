<script>
import ResourceTable from '@/components/ResourceTable';
import {
  AGE,
  STATE,
  NAME,
} from '@/config/table-headers';

export default {
  name:       'ListBundle',
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
        {
          name:     'deploymentsReady',
          labelKey: 'tableHeaders.bundleDeploymentsReady',
          value:    'status.display.readyClusters',
          sort:     'status.display.readyClusters',
          search:   ['status.summary.ready', 'status.summary.desiredReady'],
        },
        AGE
      ];

      return out;
    },
  },
};
</script>

<template>
  <ResourceTable
    :schema="schema"
    :headers="headers"
    :rows="rows"
  >
    <template #cell:deploymentsReady="{row}">
      <span v-if="row.status.summary.desiredReady != row.status.summary.ready" class="text-warning">
        {{ row.status.summary.ready }}/{{ row.status.summary.desiredReady }}</span>
      <span v-else>{{ row.status.summary.desiredReady }}</span>
    </template>
  </ResourceTable>
</template>
