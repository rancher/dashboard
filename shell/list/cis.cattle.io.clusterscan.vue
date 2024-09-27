<script>
import ResourceTable from '@shell/components/ResourceTable';
import { AGE } from '@shell/config/table-headers';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { allHash } from '@shell/utils/promise';
import { fetchSpecsScheduledScanConfig } from '@shell/models/cis.cattle.io.clusterscan';

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
    // Fetch the list and schema resource fields in parallel
    const res = await allHash({
      resources:              this.$fetchType(this.resource),
      hasScheduledScanConfig: fetchSpecsScheduledScanConfig(this.schema),
    });

    this['hasScheduledScanConfig'] = res.hasScheduledScanConfig;
  },

  data() {
    return { hasScheduledScanConfig: null };
  },

  computed: {
    // warning state and scheduling added in the same version of cis so a check for one is a check for the other
    hasWarningState() {
      return this.hasScheduledScanConfig;
    },

    headers() {
      const headersFromSchema = this.$store.getters['type-map/headersFor'](this.schema);

      if (!this.hasWarningState) {
        const toRemove = ['warn', 'nextScanAt', 'lastRunTimestamp'];

        const filtered = headersFromSchema.filter((header) => !toRemove.includes(header.name));

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
    :loading="$fetchState.pending"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
  />
</template>
