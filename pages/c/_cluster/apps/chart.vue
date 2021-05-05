<script>
import Loading from '@/components/Loading';
import ChartMixin from '@/pages/c/_cluster/apps/chart_mixin';
import Banner from '@/components/Banner';
import ChartReadme from '@/components/ChartReadme';
import LazyImage from '@/components/LazyImage';
import DateFormatter from '@/components/formatter/Date';
import isEqual from 'lodash/isEqual';
import { CHART, REPO, REPO_TYPE, VERSION } from '@/config/query-params';

export default {
  components: {
    Banner,
    ChartReadme,
    DateFormatter,
    LazyImage,
    Loading,
  },

  mixins: [
    ChartMixin
  ],

  async fetch() {
    await this.baseFetch();
  },

  data() {
    return {
      showLastVersions:  10,
      showMoreVersions:  false,
    };
  },

  computed: {
    versions() {
      return this.showMoreVersions ? this.mappedVersions : this.mappedVersions.slice(0, this.showLastVersions);
    },

    clusterToolWarning() {
      if (!this.existing) {
        return;
      }
      const url = this.$router.resolve(this.appLocation()).href;

      return this.isClusterTool ? this.t('catalog.chart.errors.clusterToolExists', { url }, true) : '';
    },

    maintainers() {
      return this.version.maintainers.map((m) => {
        return {
          id:   m.name,
          text: m.name,
          url:  `mailto:${ m.email }`
        };
      });
    },

  },

  watch: {
    '$route.query'(neu, old) {
      if ( !isEqual(neu, old) ) {
        this.$fetch();
      }
    },
  },

  methods: {
    install() {
      this.$router.push({
        name:   'c-cluster-apps-install',
        params: {
          cluster:  this.$route.params.cluster,
          product:  this.$store.getters['productId'],
        },
        query: {
          [REPO_TYPE]: this.query.repoType,
          [REPO]:      this.query.repoName,
          [CHART]:     this.query.chartName,
          [VERSION]:   this.query.versionName,
        }
      });
    },

  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div v-if="chart" class="chart-header">
      <div class="name-logo-install">
        <div class="name-logo">
          <h1>
            <nuxt-link :to="{ name: 'c-cluster-apps-charts' }">
              {{ t('catalog.chart.header.charts') }}:
            </nuxt-link>
            {{ chart.chartDisplayName }} ({{ targetVersion }})
          </h1>
          <div v-if="chart.icon" class="logo-container">
            <div class="logo-bg ml-10">
              <LazyImage :src="chart.icon" class="logo" />
            </div>
          </div>
        </div>
        <button v-if="!requires.length && (!clusterToolWarning)" type="button" class="btn role-primary" @click.prevent="install">
          {{ t(`asyncButton.${action}.action` ) }}
        </button>
      </div>
      <div v-if="requires.length || warnings.length || clusterToolWarning" class="mt-20">
        <Banner v-for="msg in requires" :key="msg" color="error">
          <span v-html="msg" />
        </Banner>

        <Banner v-for="msg in warnings" :key="msg" color="warning">
          <span v-html="msg" />
        </Banner>

        <Banner v-if="clusterToolWarning" color="warning">
          <span v-html="clusterToolWarning" />
        </Banner>
      </div>
      <div v-else-if="version && version.description" class="description mt-10">
        <p>
          {{ version.description }}
        </p>
      </div>
    </div>

    <div class="spacer"></div>

    <div class="chart-content">
      <ChartReadme v-if="hasReadme" :version-info="versionInfo" class="chart-content__tabs" />
      <div v-else class="chart-content__tabs">
        {{ t('catalog.install.appReadmeMissing', {}, true) }}
      </div>
      <div v-if="version" class="chart-content__right-bar ml-20">
        <div class="chart-content__right-bar__section">
          <h3>
            {{ t('catalog.chart.info.chartVersions.label') }}
          </h3>
          <div v-for="vers of versions" :key="vers.id" class="chart-content__right-bar__section--cVersion">
            <b v-if="vers.originalVersion === version.version">{{ vers.shortLabel }}</b>
            <a v-else v-tooltip="vers.label.length > 16 ? vers.label : null" @click.prevent="selectVersion(vers)">
              {{ vers.shortLabel }}
            </a>
            <DateFormatter :value="vers.created" :show-time="false" />
          </div>
          <div class="mt-10 chart-content__right-bar__section--showMore">
            <button v-if="mappedVersions.length > showLastVersions" type="button" class="btn btn-sm role-link" @click="showMoreVersions = !showMoreVersions">
              {{ t(`catalog.chart.info.chartVersions.${showMoreVersions ? 'showLess' : 'showMore'}`) }}
            </button>
          </div>
        </div>
        <div class="chart-content__right-bar__section">
          <h3 t>
            {{ t('catalog.chart.info.appVersion') }}
          </h3>
          {{ version.appVersion }}
        </div>
        <div v-if="version.home" class="chart-content__right-bar__section">
          <h3>{{ t('catalog.chart.info.home') }}</h3>
          <a :href="version.home" rel="nofollow noopener noreferrer" target="_blank">{{ version.home }}</a>
        </div>
        <div v-if="version.maintainers" class="chart-content__right-bar__section">
          <h3>{{ t('catalog.chart.info.maintainers') }}</h3>
          <a v-for="m of maintainers" :key="m.id" :href="m.url" rel="nofollow noopener noreferrer" target="_blank">{{ m.text }}</a>
        </div>
        <div v-if="version.sources" class="chart-content__right-bar__section">
          <h3>{{ t('catalog.chart.info.related') }}</h3>
          <a v-for="s of version.sources" :key="s" :href="s" rel="nofollow noopener noreferrer" target="_blank">{{ s }}</a>
        </div>
        <div v-if="version.urls" class="chart-content__right-bar__section">
          <h3>{{ t('catalog.chart.info.chartUrls') }}</h3>
          <a v-for="url of version.urls" :key="url" :href="url" rel="nofollow noopener noreferrer" target="_blank">{{ version.urls.length === 1 ? 'Download': url }}</a>
        </div>
        <div v-if="version.keywords" class="chart-content__right-bar__section chart-content__right-bar__section--keywords">
          <h3>{{ t('catalog.chart.info.keywords') }}</h3>
          {{ version.keywords.join(', ') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $name-height: 30px;
  $padding: 5px;

  .chart-header {

    .name-logo-install {
      display: flex;
      height: $name-height;
      justify-content: space-between;
    }

    .name-logo {
      display: flex;
    }

    .logo-container {
      height: $name-height;
      width: $name-height;
      text-align: center;
    }

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

    .description {
      margin-right: 80px;
    }
  }

  .chart-content {
    display: flex;
    &__tabs {
      flex: 1;
    }
    &__right-bar {
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
