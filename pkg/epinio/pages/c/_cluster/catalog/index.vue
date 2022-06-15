<script>
import Loading from '@shell/components/Loading';
import ChartMixin from '@shell/mixins/chart';
import { Banner } from '@components/Banner';
import ChartReadme from '@shell/components/ChartReadme';
import LazyImage from '@shell/components/LazyImage';
import DateFormatter from '@shell/components/formatter/Date';
import { EPINIO_PRODUCT_NAME } from '../../../../types';
import { mapGetters } from 'vuex';
import TypeDescription from '@shell/components/TypeDescription';
export default {
  components: {
    Banner,
    ChartReadme,
    DateFormatter,
    LazyImage,
    Loading,
    TypeDescription
  },

  mixins: [
    ChartMixin
  ],

  data() {
    return {};
  },

  computed: {
    ...mapGetters(['currentCluster']),
    chart() {
      return this.$route.params.chart;
    }
  },
};
</script>

<template>
  <div>
    <TypeDescription resource="chart" />

    <div v-if="chart" class="chart-header">
      <div class="name-logo-install">
        <div class="name-logo">
          <div class="logo-bg">
            <LazyImage :src="chart.serviceIcon" class="logo" />
          </div>
          <h1>
            <!-- // TODO: Fix this path -->
            <nuxt-link :to="{ name: `${ EPINIO_PRODUCT_NAME }-c-cluster-catalog` }">
              {{ t('catalog.chart.header.charts') }}:
            </nuxt-link>
            {{ chart.chart }} ({{ chart.chartVersion }})
          </h1>
        </div>
        <button v-if="!requires.length" type="button" class="btn role-primary" @click.prevent="install">
          {{ t(`asyncButton.${action}.action` ) }}
        </button>
      </div>
      <!-- <div v-if="chart.windowsIncompatible" class="mt-5">
        <label class="os-label">{{ t('catalog.charts.windowsIncompatible') }}</label>
      </div> -->
      <div class="spacer"></div>
      <div v-if="chart" class="description mt-10">
        <p>
          {{ chart.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $name-height: 50px;
  $padding: 5px;

  .chart-header {

    .name-logo-install {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: $name-height;
    }

    .name-logo {
      display: flex;
      align-items: center;

      .logo-bg {
        height: $name-height;
        width: $name-height;
        background-color: white;
        border: $padding solid white;
        border-radius: calc( 3 * var(--border-radius));
        position: relative;
      }

      .logo {
        max-height: $name-height - 2 * $padding;
        max-width: $name-height - 2 * $padding;
        position: absolute;
        width: auto;
        height: auto;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        margin: auto;
      }

      h1 {
        margin: 0 20px;
      }
    }

    .os-label{
      background-color: var(--warning-banner-bg);
      color: var(--warning);
    }

    .btn {
      height: 30px;
    }

    .description {
      margin-right: 80px;
    }
  }

  .chart-content {
    display: flex;
    &__tabs {
      flex: 1;
      min-width: 400px;
    }
    &__right-bar {
      min-width: 260px;
      max-width: 260px;

      &__section {
        display: flex;
        flex-direction: column;
        padding-bottom: 20px;
        word-break: break-all;
        a {
          cursor: pointer;
        }
        &--cVersion{
          display: flex;
          justify-content: space-between;
        }

        &--keywords{
         word-break: break-word;
        }

      }
    }
  }
</style>
