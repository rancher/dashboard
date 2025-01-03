<script>
import { NORMAN } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import Masthead from '@shell/components/ResourceList/Masthead';
export default {
  name:       'NodeDrivers',
  components: {
    ResourceTable, Loading, Masthead
  },

  async fetch() {
    this.allDrivers = await this.$store.dispatch('rancher/findAll', { type: NORMAN.NODE_DRIVER }, { root: true });
  },

  data() {
    return {
      allDrivers:                       null,
      resource:                         NORMAN.NODE_DRIVER,
      schema:                           this.$store.getters['rancher/schemaFor'](NORMAN.NODE_DRIVER),
      useQueryParamsForSimpleFiltering: false,
      forceUpdateLiveAndDelayed:        10
    };
  },
  computed: {
    rows() {
      return this.allDrivers || [];
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
