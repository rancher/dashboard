<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import { NODE } from '@/config/types';
import { allHash } from '@/utils/promise';

export default {
  name:       'ListService',
  components: { Loading, ResourceTable },
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

    const hash = { rows: store.dispatch(`${ inStore }/findAll`, { type: this.$attrs.resource }) };

    if (hasNodes) {
      hash.nodes = store.dispatch(`${ inStore }/findAll`, { type: NODE });
    }
    const res = await allHash(hash);

    this.rows = res.rows;
  },

  data() {
    return { rows: [] };
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable v-else :schema="$attrs.schema" :rows="rows" :headers="$attrs.headers" :group-by="$attrs.groupBy" />
</template>
