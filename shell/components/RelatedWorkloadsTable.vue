<script>
import {
  STATE, NAME, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, TYPE, AGE
} from '@shell/config/table-headers';
import { WORKLOAD_TYPES } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';

export default {
  components: { ResourceTable },
  props:      {
    filter: {
      type:     Function,
      required: true
    }
  },
  async fetch() {
    // Enumerating instead of using Object.values() because it looks like we don't want to include replica sets for this.
    const types = [
      WORKLOAD_TYPES.DEPLOYMENT,
      WORKLOAD_TYPES.CRON_JOB,
      WORKLOAD_TYPES.DAEMON_SET,
      WORKLOAD_TYPES.JOB,
      WORKLOAD_TYPES.STATEFUL_SET
    ];
    const allWorkloadsNested = await Promise.all(types.map(type => this.$store.dispatch('cluster/findAll', { type })));
    const allWorkloads = allWorkloadsNested.flat();

    this.relatedWorkloadRows = allWorkloads.filter(this.filter);
  },
  data() {
    const relatedWorkloadHeaders = [STATE, NAME, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, TYPE, AGE];

    return {
      relatedWorkloadRows: [],
      relatedWorkloadHeaders,
      schema:              this.$store.getters['cluster/schemaFor'](WORKLOAD_TYPES.DEPLOYMENT)
    };
  },
};
</script>

<template>
  <ResourceTable :schema="schema" :rows="relatedWorkloadRows" :headers="relatedWorkloadHeaders" />
</template>
