<script>
import { EPINIO_TYPES, EPINIO_PRODUCT_NAME } from '../types';
import Loading from '@shell/components/Loading';
import SelectIconGrid from '@shell/components/SelectIconGrid';

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

  methods: {
    showDetails(chart) {
      console.log('chart: ', chart);
      this.$router.push({
        name:      `${ EPINIO_PRODUCT_NAME }-c-cluster-catalog`,
        params: {
          cluster:  this.$route.params.cluster,
          product:  this.$store.getters['productId'],
          chart:   this.chart
        },
        query: {}
      });
    },
  },
  computed: {
    list() {
      return this.$store.getters['epinio/all'](EPINIO_TYPES.CATALOG_SERVICE);
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <SelectIconGrid
      :rows="list"
      name-field="name"
      icon-field="serviceIcon"
      description-field="short_description"
      @clicked="(row) => showDetails(row)"
    />
  </div>
</template>
