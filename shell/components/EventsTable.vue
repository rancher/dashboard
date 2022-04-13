<script>
import { AGE, SIMPLE_TYPE, REASON, MESSAGE } from '@shell/config/table-headers';
import SortableTable from '@shell/components/SortableTable';

export default {
  components: { SortableTable },
  props:      {
    resource: {
      type:     Object,
      required: true
    }
  },
  data() {
    const eventHeaders = [
      SIMPLE_TYPE,
      REASON,
      MESSAGE,
      AGE
    ];

    this.loopEvents();

    return {
      eventRows:      [],
      eventHeaders,
      intervalHandle: null
    };
  },

  beforeDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  },

  methods: {
    async loopEvents() {
      this.eventRows = await this.fetchEvents();

      this.intervalHandle = setInterval(async() => {
        this.eventRows = await this.fetchEvents();
      }, 10000);
    },
    async fetchEvents() {
      const namespace = this.resource.namespace;
      const name = this.resource.name;
      const kind = this.resource.kind;

      const url = `/k8s/clusters/local/api/v1/namespaces/${ namespace }/events?fieldSelector=involvedObject.name=${ name },involvedObject.kind=${ kind }`;
      const response = await this.$store.dispatch('cluster/request', { url });

      return response.items;
    },
  }
};
</script>

<template>
  <SortableTable
    :rows="eventRows"
    :headers="eventHeaders"
    :table-actions="false"
    :row-actions="false"
    key-field="key"
    default-sort-by="state"
  />
</template>
