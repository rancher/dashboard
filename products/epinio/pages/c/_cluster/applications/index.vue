<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import Masthead from '@/components/ResourceList/Masthead';
import { EPINIO_TYPES } from '@/products/epinio/types';
import { createEpinioRoute } from '@/products/epinio/utils/custom-routing';

export default {
  components: {
    Loading,
    ResourceTable,
    Masthead
  },

  async fetch() {
    this.rows = await this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.APP });
  },

  data() {
    const resource = EPINIO_TYPES.APP;
    const schema = this.$store.getters[`epinio/schemaFor`](resource);

    return {
      schema,
      resource,

      // Provided by fetch later
      rows: null,
    };
  },

  computed: {
    headers() {
      return this.$store.getters['type-map/headersFor'](this.schema);
    },

    groupBy() {
      return this.$store.getters['type-map/groupByFor'](this.schema);
    },

    createLocation() {
      return createEpinioRoute(`c-cluster-applications-createapp`, { cluster: this.$store.getters['clusterId'] });
    }
  },

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      :schema="schema"
      :resource="resource"
      :create-location="createLocation"
    />
    <ResourceTable
      :schema="schema"
      :rows="rows"
      :headers="headers"
      :group-by="groupBy"
    />
  </div>
</template>
