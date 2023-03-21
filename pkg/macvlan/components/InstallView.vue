<script>
import { mapGetters } from 'vuex';
import { CATALOG } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import { MACVLAN_CHARTS } from '../config/macvlan-types';

export default {
  props: {},

  components: { Loading },

  async fetch() {
    this.reloadReady = false;

    if ( !this.hasSchema ) {
      await this.$store.dispatch(`${ this.currentProduct.inStore }/findAll`, { type: CATALOG.CLUSTER_REPO });
      await this.refreshCharts(1);
    }
  },

  data() {
    return { reloadReady: false };
  },

  computed: {
    ...mapGetters(['currentCluster', 'currentProduct']),
    ...mapGetters({ allRepos: 'catalog/repos' }),

    controllerChart() {
      return this.$store.getters['catalog/chart']({ chartName: MACVLAN_CHARTS.APP_NAME });
    },

    description() {
      return this.controllerChart?.versions?.[0]?.description || '';
    }
  },

  methods: {
    async refreshCharts(retry = 0) {
      try {
        await this.$store.dispatch('catalog/load', { force: true, reset: true });
      } catch (e) {
        this.$store.dispatch('growl/fromError', e);
      }

      if ( !this.controllerChart && retry === 0 ) {
        await this.refreshCharts(retry + 1);
      }

      if ( !this.controllerChart && retry === 1 ) {
        this.reloadReady = true;
      }
    },

    async chartRoute() {
      if ( !this.controllerChart ) {
        try {
          await this.refreshCharts();
        } catch (e) {
          this.$store.dispatch('growl/fromError', e);

          return;
        }
      }

      this.controllerChart.goToInstall('macvlan');
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div
    v-else
    class="container"
  >
    <div class="title p-10">
      <div class="logo mt-20 mb-10">
        <img
          src="../assets/generic-catalog.svg"
          height="64"
        >
      </div>
      <h1 class="mb-20">
        {{ t("macvlan.chart.title") }}
      </h1>
      <div class="description">
        {{ description }}
      </div>
      <button
        class="btn role-primary mt-20"
        :disabled="!controllerChart"
        @click.prevent="chartRoute"
      >
        {{ t("macvlan.chart.appInstall.button") }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  & .title {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    margin: 100px 0;
  }

  & .description {
    line-height: 20px;
  }

  & .chart-route {
    position: relative;
  }
}
</style>
