<script>
import { EPINIO_TYPES, EPINIO_PRODUCT_NAME } from '../types';
import Loading from '@shell/components/Loading';
import SelectIconGrid from '@shell/components/SelectIconGrid';
import { CHART } from '@shell/config/query-params';

export default {
  name:       'EpinioCatalogList',
  components: { Loading, SelectIconGrid },
  fetch() {
    this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.CATALOG_SERVICE });
  },
  props:      {
    schema: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return { searchQuery: null };
  },

  methods: {
    showDetails(chart) {
      this.$router.push(chart.detailLocation);
    },
  },
  computed: {
    list() {
      const list = this.$store.getters['epinio/all'](EPINIO_TYPES.CATALOG_SERVICE);

      if (!this.searchQuery) {
        return list;
      } else {
        const query = this.searchQuery.toLowerCase();

        return list.filter(e => e?.chart.toLowerCase().includes(query) || e?.description.toLowerCase().includes(query) || e?.short_description.toLowerCase().includes(query));
      }
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="filter-block">
      <input
        ref="searchQuery"
        v-model="searchQuery"
        type="search"
        class="input-sm"
        :placeholder="t('catalog.charts.search')"
      >
    </div>

    <SelectIconGrid
      :rows="list"
      name-field="name"
      icon-field="serviceIcon"
      description-field="short_description"
      @clicked="(row) => showDetails(row)"
    />
  </div>
</template>
