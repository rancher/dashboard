<script>
import { NORMAN } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import Masthead from '@shell/components/ResourceList/Masthead';
import Banner from '@components/Banner/Banner.vue';

export default {
  name:       'KontainerDrivers',
  components: {
    ResourceTable, Loading, Masthead, Banner
  },

  async fetch() {
    this.allDrivers = await this.$store.dispatch('rancher/findAll', { type: NORMAN.KONTAINER_DRIVER }, { root: true });
  },

  data() {
    return {
      allDrivers:                       null,
      resource:                         NORMAN.KONTAINER_DRIVER,
      schema:                           this.$store.getters['rancher/schemaFor'](NORMAN.KONTAINER_DRIVER),
      useQueryParamsForSimpleFiltering: false,
      forceUpdateLiveAndDelayed:        10,
    };
  },
  computed: {
    rows() {
      return this.allDrivers || [];
    },
    hasEmberUiDrivers() {
      return this.rows.some((driver) => driver.active && driver.isEmber);
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
      :type-display="t('drivers.kontainer.title')"
    />
    <Banner
      v-if="hasEmberUiDrivers"
      color="warning"
      label-key="drivers.kontainer.emberRemovalMessage"
    />
    <ResourceTable
      :schema="schema"
      :rows="rows"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
      :tableActions="true"
      :data-testid="'kontainer-driver-list'"
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
