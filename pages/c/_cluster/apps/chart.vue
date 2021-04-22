<script>
import Loading from '@/components/Loading';
import ChartMixin from '@/pages/c/_cluster/apps/chart_mixin';
import { mapGetters } from 'vuex';
import LazyImage from '@/components/LazyImage';
import Markdown from '@/components/Markdown';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import DateFormatter from '@/components/formatter/Date';
import isEqual from 'lodash/isEqual';
import { CHART, REPO, REPO_TYPE, VERSION } from '@/config/query-params';

export default {
  components: {
    DateFormatter,
    LazyImage,
    Loading,
    Markdown,
    Tab,
    Tabbed,
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
    ...mapGetters(['currentCluster']),
    versions() {
      return this.showMoreVersions ? this.mappedVersions : this.mappedVersions.slice(0, this.showLastVersions);
    },
    hasReadme() {
      return this.versionInfo?.appReadme || this.versionInfo?.readme;
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
    }
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
            {{ chart.chartDisplayName }} ({{ version.version }})
          </h1>
          <div v-if="chart.icon" class="logo-container">
            <div class="logo-bg ml-10">
              <LazyImage :src="chart.icon" class="logo" />
            </div>
          </div>
        </div>
        <button type="button" class="btn role-primary" @click.prevent="install">
          {{ t('catalog.chart.header.install') }}
        </button>
      </div>
      <div v-if="version.description" class="description mt-10">
        <p>
          {{ version.description }}
        </p>
      </div>
    </div>
    <div class="spacer"></div>
    <div class="chart-content">
      <Tabbed v-if="hasReadme" class="chart-content__tabs">
        <Tab v-if="versionInfo && versionInfo.appReadme" name="appReadme" :label="t('catalog.install.section.appReadme')" :weight="2">
          <Markdown v-model="versionInfo.appReadme" class="md md-desc" />
        </Tab>
        <Tab v-if="versionInfo && versionInfo.readme" name="readme" :label="t('catalog.install.section.readme')" :weight="1">
          <Markdown v-model="versionInfo.readme" class="md md-desc" />
        </Tab>
      </Tabbed>
      <div v-else class="chart-content__tabs">
        {{ t('catalog.install.appReadmeMissing', {}, true) }}
      </div>
      <div class="chart-content__right-bar ml-20">
        <div class="chart-content__right-bar__section">
          <h3>
            {{ t('catalog.chart.info.chartVersions.label') }}
          </h3>
          <div v-for="vers of versions" :key="vers.id" class="chart-content__right-bar__section--cVersion">
            <a v-tooltip="vers.label.length > 16 ? vers.label : null" :class="{'selected': vers.label === version.version}" @click.prevent="selectVersion(vers)">
              {{ vers.shortLabel }}
            </a>
            <DateFormatter :value="vers.created" :show-time="false" />
          </div>
          <div class="mt-10 chart-content__right-bar__section--cVersion">
            <button v-if="mappedVersions.length > showLastVersions" type="button" class="btn role-secondary" @click="showMoreVersions = !showMoreVersions">
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
          <a v-for="url of version.urls" :key="url" :href="url" rel="nofollow noopener noreferrer" target="_blank">{{ url }}</a>
        </div>
        <div v-if="version.keywords" class="chart-content__right-bar__section chart-content__right-bar__section--keywords">
          <h3>{{ t('catalog.chart.info.keywords') }}Keywords</h3>
          {{ version.keywords.join(', ') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $name-height: 30px;
  $padding: 5px;
  .md {
    overflow: auto;
    max-width: 100%;

    ::v-deep {
      * + H1,
      * + H2,
      * + H3,
      * + H4,
      * + H5,
      * + H6 {
        margin-top: 40px;
      }
    }

    ::v-deep pre {
      white-space: break-spaces;
      word-break: break-word;
    }
  }

  ::v-deep .md-desc > h1:first-of-type {
    display: none;
  }

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

          .selected {
            font-weight: bold;
          }
        }
        &--keywords{
         word-break: break-word;
        }

      }
    }
  }
</style>
