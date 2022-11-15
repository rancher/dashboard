<script>
import ResourceTable from '@shell/components/ResourceTable';
import { NODE } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'ListService',
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

  // fetch nodes before loading this page, as they may be referenced in the Target table column
  async fetch() {
    const store = this.$store;
    const inStore = store.getters['currentStore']();
    let hasNodes = false;

    try {
      const schema = store.getters[`${ inStore }/schemaFor`](NODE);

      if (schema) {
        hasNodes = true;
      }
    } catch {}

    const hash = { rows: this.$fetchType(this.resource) };

    if (hasNodes) {
      hash.nodes = store.dispatch(`${ inStore }/findAll`, { type: NODE });
    }
    await allHash(hash);
  }
};
</script>

<template>
  <ResourceTable
    :schema="schema"
    :rows="rows"
    :headers="$attrs.headers"
    :group-by="$attrs.groupBy"
    :loading="loading"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
  />
</template>
