<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { get } from '@shell/utils/object';
import { AGE } from '@shell/config/table-headers';

export default {
  components: { Loading, ResourceTable },

  props: {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    this.rows = await this.$store.dispatch('cluster/findAll', { type: this.resource });
  },

  data() {
    return { rows: null };
  },

  computed: {
    // warning state and scheduling added in the same version of cis so a check for one is a check for the other
    hasWarningState() {
      const specSchema = this.$store.getters['cluster/schemaFor'](get(this.schema, 'resourceFields.spec.type') || '');

      if (!specSchema) {
        return false;
      }

      return !!get(specSchema, 'resourceFields.scheduledScanConfig');
    },

    headers() {
      const headersFromSchema = this.$store.getters['type-map/headersFor'](this.schema);

      if (!this.hasWarningState) {
        const toRemove = ['warn', 'nextScanAt', 'lastRunTimestamp'];

        const filtered = headersFromSchema.filter(header => !toRemove.includes(header.name));

        filtered.push(AGE);

        return filtered;
      } else {
        return headersFromSchema;
      }
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable v-else :schema="schema" :rows="rows" :headers="headers" />
</template>
