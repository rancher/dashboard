<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import Masthead from '@shell/components/ResourceList/Masthead';
import LinkDetail from '@shell/components/formatter/LinkDetail';
import { EPINIO_TYPES } from '../../../../types';
import { createEpinioRoute } from '../../../../utils/custom-routing';

export default {
  components: {
    Loading,
    LinkDetail,
    ResourceTable,
    Masthead
  },

  async fetch() {
    await this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.APP });
    this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.CONFIGURATION });
  },

  data() {
    const resource = EPINIO_TYPES.APP;
    const schema = this.$store.getters[`epinio/schemaFor`](resource);

    return {
      schema,
      resource,
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
    },

    rows() {
      return this.$store.getters['epinio/all'](this.resource);
    },
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
      <template #cell:configurations="{ row }">
        <span v-if="row.configurations.length">
          <template v-for="(configuration, index) in row.configurations">
            <LinkDetail :key="configuration.id" :row="configuration" :value="configuration.meta.name" />
            <span v-if="index < row.configurations.length - 1" :key="configuration.id + 'i'">, </span>
          </template>
        </span>
        <span v-else class="text-muted">&nbsp;</span>
      </template>
      <template #cell:route="{ row }">
        <span v-if="row.configuration.routes.length" class="route">
          <template v-for="(route, index) in row.configuration.routes">
            <a v-if="row.state === 'running'" :key="route.id" :href="`https://${route}`" target="_blank" rel="noopener noreferrer nofollow">{{ `https://${route}` }}</a>
            <span v-else :key="route.id">{{ `https://${route}` }}</span>
            <span v-if="index < row.configuration.routes.length - 1" :key="route.id + 'i'">, </span>
          </template>
        </span>
        <span v-else class="text-muted">&nbsp;</span>
      </template>
    </ResourceTable>
  </div>
</template>

<style lang="scss" scoped>
.route {
  word-break: break-all;
}
</style>
