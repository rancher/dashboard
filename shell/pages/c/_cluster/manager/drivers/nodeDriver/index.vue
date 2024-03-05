<script>
import { MANAGEMENT } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import ResourceFetch from '@shell/mixins/resource-fetch';
import Masthead from '@shell/components/ResourceList/Masthead';
export default {
  name:       'NodeDrivers',
  components: {
    ResourceTable, Loading, Masthead
  },
  mixins: [ResourceFetch],

  async fetch() {
    await this.$fetchType(this.resource);
  },

  data() {
    return {
      resource:                         MANAGEMENT.NODE_DRIVER,
      schema:                           this.$store.getters['management/schemaFor'](MANAGEMENT.NODE_DRIVER),
      useQueryParamsForSimpleFiltering: false,
      forceUpdateLiveAndDelayed:        10
    };
  },
  methods: {
    mounted() {
      window.c = this;
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      :schema="schema"
      :resource="resource"
      :type-display="t('drivers.node.title')"
    />
    <ResourceTable
      :schema="schema"
      :rows="rows"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
      :tableActions="true"
      :data-testid="'node-driver-list'"
    >
      <template #cell:name="{row}">
        <span>{{ row.nameDisplay }}</span>
        <div
          v-if="row.description"
          class="description text-muted text-small"
        >
          {{ row.description }}
        </div>
      </template>
    </ResourceTable>
  </div>
</template>
