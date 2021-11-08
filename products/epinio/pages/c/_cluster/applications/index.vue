<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import Masthead from '@/components/ResourceList/Masthead';
import LinkDetail from '@/components/formatter/LinkDetail';
import { EPINIO_TYPES } from '@/products/epinio/types';
import { createEpinioRoute } from '@/products/epinio/utils/custom-routing';

export default {
  components: {
    Loading,
    LinkDetail,
    ResourceTable,
    Masthead
  },

  async fetch() {
    const all = await Promise.all([
      this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.APP }),
      this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.SERVICE })
    ]);

    this.rows = all[0];
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
    >
      <template #cell:services="{ row }">
        <span v-if="row.services.length">
          <template v-for="(service, index) in row.services">
            <LinkDetail :key="service.id" :row="service" :value="service.name" />
            <span v-if="index < row.services.length - 1" :key="service.id + 'i'">, </span>
          </template>
        </span>
        <span v-else class="text-muted">&nbsp;</span>
      </template>
      <template #cell:route="{ row }">
        <span v-if="row.configuration.routes.length">
          <template v-for="(route, index) in row.configuration.routes">
            <a :key="route.id" :href="`https://${route}`" target="_blank" rel="noopener noreferrer nofollow">{{ `https://${route}` }}</a>
            <span v-if="index < row.configuration.routes.length - 1" :key="route.id + 'i'">, </span>
          </template>
        </span>
        <span v-else class="text-muted">&nbsp;</span>
      </template>
    </ResourceTable>
  </div>
</template>
