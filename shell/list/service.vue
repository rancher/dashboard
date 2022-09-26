<script>
import ResourceTable from '@shell/components/ResourceTable';
import { NODE } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'ListService',
  components: { ResourceTable },
  mixins:     [ResourceFetch],
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

    const hash = { rows: this.$fetchType(this.$attrs.resource) };

    if (hasNodes) {
      hash.nodes = store.dispatch(`${ inStore }/findAll`, { type: NODE });
    }
    await allHash(hash);
  },

  computed: {
    rows() {
      const inStore = this.$store.getters['currentStore'](this.$attrs.resource);

      return this.$store.getters[`${ inStore }/all`](this.$attrs.resource);
    },
    loading() {
      return this.rows.length ? false : this.$fetchState.pending;
    },
  },
};
</script>

<template>
  <ResourceTable
    :schema="$attrs.schema"
    :rows="rows"
    :headers="$attrs.headers"
    :group-by="$attrs.groupBy"
    :loading="loading"
  />
</template>
