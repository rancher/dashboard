<script>
import ResourceTable from '@/components/ResourceTable';
import Poller from '@/utils/poller';
import {
  STATE, NAME, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM
} from '@/config/table-headers';

import { METRIC } from '@/config/types';

const METRICS_POLL_RATE_MS = 30000;
const MAX_FAILURES = 2;

export default {
  name:       'ListNode',
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

  data() {
    return {
      headers:         [STATE, NAME, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM],
      metricPoller:    new Poller(this.loadMetrics, METRICS_POLL_RATE_MS, MAX_FAILURES),
    };
  },

  mounted() {
    this.metricPoller.start();
  },

  beforeDestroy() {
    this.metricPoller.stop();
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
  <ResourceTable
    v-bind="$attrs"
    :schema="schema"
    :headers="headers"
    :rows="[...rows]"
    key-field="_key"
    v-on="$listeners"
  >
  </ResourceTable>
</template>
