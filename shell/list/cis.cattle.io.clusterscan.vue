<script>
import ResourceTable from '@shell/components/ResourceTable';
import { get } from '@shell/utils/object';
import { AGE } from '@shell/config/table-headers';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  components: { ResourceTable },
  mixins:     [ResourceFetch],
  props:      {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    await this.$fetchType(this.resource);
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
    },
  },
};
</script>

<template>
  <ResourceTable
    :schema="schema"
    :rows="rows"
    :headers="headers"
    :loading="loading"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
  />
</template>
