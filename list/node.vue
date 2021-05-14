<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import {
  STATE, NAME, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM
} from '@/config/table-headers';
import metricPoller from '@/mixins/metric-poller';

import { CAPI, METRIC, NODE } from '@/config/types';

export default {
  name:       'ListNode',
  components: { Loading, ResourceTable },
  mixins:     [metricPoller],

  props: {
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    this.rows = await this.$store.dispatch('cluster/findAll', { type: NODE });

    if ( this.$store.getters['management/schemaFor'](CAPI.MACHINE) ) {
      await this.$store.dispatch('management/findAll', { type: CAPI.MACHINE });
    }
  },

  data() {
    return {
      rows:         null,
      headers:      [STATE, NAME, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM],
    };
  },

  methods: {
    async loadMetrics() {
      const schema = this.$store.getters['cluster/schemaFor'](METRIC.NODE);

      if (schema) {
        await this.$store.dispatch('cluster/findAll', {
          type: METRIC.NODE,
          opt:  { force: true }
        });

        this.$forceUpdate();
      }
    }
  }

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable
    v-else
    v-bind="$attrs"
    :schema="schema"
    :headers="headers"
    :rows="[...rows]"
    key-field="_key"
    v-on="$listeners"
  >
  </ResourceTable>
</template>
