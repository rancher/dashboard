<script>
import Loading from '@shell/components/Loading';
import ChartMixin from '@shell/mixins/chart';
import { Banner } from '@components/Banner';
import LazyImage from '@shell/components/LazyImage';
import ChartDetailBody from '@shell/components/ChartDetailBody.vue';
import isEqual from 'lodash/isEqual';
import {
  CHART, REPO, REPO_TYPE, VERSION, SEARCH_QUERY, CATEGORY, TAG, DEPRECATED
} from '@shell/config/query-params';
import { DATE_FORMAT } from '@shell/store/prefs';
import { ZERO_TIME } from '@shell/config/types';
import { escapeHtml } from '@shell/utils/string';
import { mapGetters } from 'vuex';
import { compatibleVersionsFor } from '@shell/store/catalog';
import AppChartCardSubHeader from '@shell/pages/c/_cluster/apps/charts/AppChartCardSubHeader';
import AppChartCardFooter from '@shell/pages/c/_cluster/apps/charts/AppChartCardFooter';
import day from 'dayjs';
import { RcButton } from '@components/RcButton';

export default {
  components: {
    Banner,
    LazyImage,
    Loading,
    ChartDetailBody,
    AppChartCardSubHeader,
    AppChartCardFooter,
    RcButton
  },

  mixins: [
    ChartMixin
  ],

  async fetch() {
    await this.fetchChart();
  },

  data() {
    return {
      SEARCH_QUERY,
      ZERO_TIME,
      showLastVersions: 7,
      showMoreVersions: false,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    headerContent() {
      return {
        ...this.chart.cardContent,
        subHeaderItems: this.chart.cardContent.subHeaderItems.map((item, i) => i === 0 ? ({
          icon:        'icon-version-alt',
          iconTooltip: { key: 'tableHeaders.version' },
          label:       this.query.versionName
        }) : item)
      };
    },

    versions() {
      return this.showMoreVersions ? this.mappedVersions : this.mappedVersions.slice(0, this.showLastVersions);
    },

    targetedAppWarning() {
      if (!this.existing) {
        return;
      }
      const url = this.$router.resolve(this.appLocation()).href;

      return this.isChartTargeted ? this.t('catalog.chart.errors.clusterToolExists', { url }, true) : '';
    },

    appVersion() {
      return this.version.appVersion || this.versionInfo?.chart?.appVersion;
    },

    home() {
      return this.version.home || this.versionInfo?.chart?.home;
    },

    maintainers() {
      const maintainers = this.version.maintainers || this.versionInfo?.chart?.maintainers || [];

      return maintainers.map((m, i) => {
        const label = m.name || m.url || m.email || this.t('generic.unknown');
        let href = null;

        if (m.url) {
          href = m.url;
        } else if (m.email) {
          href = `mailto:${ m.email }`;
        }

        return {
          id:   `${ m.name }-${ i }`,
          name: m.name,
          label,
          href
        };
      });
    },

    osWarning() {
      if (this.chart) {
        const compatible = compatibleVersionsFor(this.chart, this.currentCluster.workerOSs, this.showPreRelease );

        const currentlyCompatible = !!compatible.find((version) => {
          return version.version === this.targetVersion;
        });

        if (currentlyCompatible) {
          return false;
        } else if (compatible.length > 0) {
          return this.t('catalog.os.versionIncompatible');
        } else {
          return this.t('catalog.os.chartIncompatible');
        }
      }

      return false;
    },

    warningMessage() {
      const {
        deprecated, experimental, chartName: name, chartNameDisplay
      } = this.chart;
      const chartName = chartNameDisplay || name;

      if (deprecated && experimental) {
        return this.t('catalog.chart.deprecatedAndExperimentalWarning', { chartName });
      } else if (deprecated) {
        return this.t('catalog.chart.deprecatedWarning', { chartName });
      } else if (experimental) {
        return this.t('catalog.chart.experimentalWarning', { chartName });
      }

      return '';
    }

  },

  watch: {
    '$route.query'(neu, old) {
      // If the query changes, refetch the chart
      // When going back to app list, the query is empty and we don't want to refetch
      if ( !isEqual(neu, old) && Object.keys(neu).length > 0 ) {
        this.$fetch();
      }
    },
  },

  methods: {
    install() {
      this.$router.push({
        name:   'c-cluster-apps-charts-install',
        params: {
          cluster: this.$route.params.cluster,
          product: this.$store.getters['productId'],
        },
        query: {
          [REPO_TYPE]:  this.query.repoType,
          [REPO]:       this.query.repoName,
          [CHART]:      this.query.chartName,
          [VERSION]:    this.query.versionName,
          [DEPRECATED]: this.query.deprecated,
        }
      });
    },
    handleHeaderItemClick(type, value) {
      const params = {
        cluster: this.$route.params.cluster,
        product: this.$store.getters['productId'],
      };

      let queryValue;

      if (type === REPO) {
        const repos = this.$store.getters['catalog/repos'];

        queryValue = repos.find((r) => r.nameDisplay === value)?.metadata?.uid;
      } else if (type === CATEGORY || type === TAG) {
        queryValue = value.toLowerCase();
      }

      if (queryValue) {
        this.$router.push({
          name:  'c-cluster-apps-charts',
          params,
          query: { [type]: queryValue },
        });
      }
    },
    formatVersionDate(date) {
      if (date === ZERO_TIME) {
        return this.t('generic.na');
      }

      return day(date).format('MMM D, YYYY');
    },
    getVersionDateTooltip(date) {
      if (date === ZERO_TIME) {
        return this.t('catalog.chart.info.chartVersions.missingVersionDate');
      }

      const dateFormat = escapeHtml(this.$store.getters['prefs/get'](DATE_FORMAT));

      return day(date).format(dateFormat);
    },
    getVersionRoute(vers) {
      const version = vers.id;

      return {
        name:   this.$route.name,
        params: this.$route.params,
        query:  {
          ...this.$route.query,
          [VERSION]: version,
        }
      };
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <main v-else>
    <div
      v-if="chart"
      class="chart-header"
    >
      <div class="logo-container">
        <div class="logo-box">
          <LazyImage
            :src="chart.icon"
            class="logo"
            :alt="t('catalog.charts.iconAlt', { app: chart.chartNameDisplay })"
          />
        </div>
        <div
          v-if="chart.featured"
          v-clean-tooltip="t('generic.featured')"
          class="featured-pill"
        >
          {{ t('generic.shortFeatured') }}
        </div>
      </div>
      <div class="header-body">
        <div class="header-top">
          <h1
            class="title"
            data-testid="chart-header-title"
          >
            <router-link :to="{ name: 'c-cluster-apps-charts' }">
              {{ t('catalog.chart.header.charts') }}:
            </router-link>
            {{ chart.chartNameDisplay }}
          </h1>
          <div
            v-if="headerContent.statuses.length"
            class="statuses"
          >
            <div
              v-for="(status, i) in headerContent.statuses"
              :key="i"
              class="status"
            >
              <i
                v-clean-tooltip="status.tooltip.key ? t(status.tooltip.key) : status.tooltip.text"
                :class="['icon', status.icon, status.color]"
                :style="{color: status.customColor}"
                role="img"
                :aria-label="status.tooltip.key ? t(status.tooltip.key) : status.tooltip.text"
              />
            </div>
          </div>
        </div>
        <div class="header-sub-top">
          <AppChartCardSubHeader :items="headerContent.subHeaderItems" />
        </div>
        <div class="header-middle">
          <div
            v-if="version && version.description"
            class="description"
          >
            <p>{{ version.description }}</p>
          </div>
        </div>
        <div class="header-bottom">
          <AppChartCardFooter
            :clickable="true"
            :items="headerContent.footerItems"
            @click:item="handleHeaderItemClick"
          />
        </div>
      </div>
      <RcButton
        v-if="!requires.length"
        data-testid="btn-chart-install"
        class="btn role-primary"
        @click.prevent="install"
      >
        <i
          :class="['icon', action.icon, 'mmr-2']"
        />
        {{ t(`catalog.chart.chartButton.action.${action.tKey}` ) }}
      </RcButton>
    </div>

    <div class="dashed-spacer" />

    <ChartDetailBody
      :version="version"
      :version-info="versionInfo"
      :version-info-error="versionInfoError"
      :versions="mappedVersions"
      :repo="repo"
      :chart="chart"
      :current-version="currentVersion"
      :app-version="appVersion || ''"
      :home="home || ''"
      :maintainers="maintainers"
      @select-version="$router.push(getVersionRoute($event))"
    >
      <template #banners>
        <Banner
          v-if="warningMessage"
          color="warning"
          :label="warningMessage"
          data-testid="deprecation-and-experimental-banner"
        />
        <div
          v-if="requires.length || warnings.length || targetedAppWarning || osWarning"
          class="chart-banners"
        >
          <Banner
            v-if="osWarning"
            color="error"
          >
            <span v-clean-html="osWarning" />
          </Banner>
          <Banner
            v-for="(msg, i) in requires"
            :key="'req-' + i"
            color="error"
          >
            <span v-clean-html="msg" />
          </Banner>
          <Banner
            v-for="(msg, i) in warnings"
            :key="'warn-' + i"
            color="warning"
          >
            <span v-clean-html="msg" />
          </Banner>
          <Banner
            v-if="targetedAppWarning"
            color="warning"
          >
            <span v-clean-html="targetedAppWarning" />
          </Banner>
        </div>
      </template>

      <template #sidebar-extra>
        <div
          v-if="version && version.keywords"
          class="chart-body__info-section chart-body__info-section--keywords"
        >
          <h4>{{ t('catalog.chart.info.keywords') }}</h4>
          <div class="keyword-links">
            <span
              v-for="(keyword, i) in version.keywords"
              :key="i"
              class="keyword-item"
            >
              <router-link
                v-clean-tooltip="t('catalog.charts.findSimilar.message', { type: t('catalog.charts.findSimilar.types.keyword') }, true)"
                :to="{ name: 'c-cluster-apps-charts', query: { [SEARCH_QUERY]: keyword } }"
                data-testid="chart-keyword-link"
              >
                {{ keyword }}
              </router-link>
              <span v-if="version.keywords.length > 1 && i !== version.keywords.length - 1">,</span>
            </span>
          </div>
        </div>
      </template>
    </ChartDetailBody>
  </main>
</template>

<style lang="scss" scoped>
  $logo-box-width: 60px;
  $name-height: 50px;
  $padding: 5px;

  .chart-header {
    display: flex;
    flex-direction: row;
    width: 100%;
    gap: var(--gap-lg);

    .logo-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;

      .logo-box {
        width: $logo-box-width;
        height: $logo-box-width;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #fff;
        border-radius: var(--border-radius);

        .logo {
          width: 48px;
          height: 48px;
          object-fit: contain;
        }
      }

      .featured-pill {
        display: flex;
        width: $logo-box-width;
        padding: 4px 8px;
        justify-content: center;
        align-items: center;
        border-radius: var(--border-radius);
        background: var(--default);
        text-transform: uppercase;
        color: var(--disabled-text);
        font-size: 10px;
        font-weight: 600;
      }
    }

    .header-body {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--gap);

      .header-top {
        display: flex;

        .title {
          margin: 0 12px 0 0;
        }

        .statuses {
          display: flex;
          align-items: center;
          gap: 12px;

          .status {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;

            .icon {
              font-size: 23px;
              &.error    { color: var(--error); }
              &.info     { color: var(--info); }
              &.success  { color: var(--success); }
            }
          }
        }
      }
    }

    .btn {
      margin-left: auto;
      height: 40px;
    }

    .description {
      line-height: 21px;
    }
  }

  .chart-banners {
    .banner {
      margin-top: 0;
      margin-bottom: 24px;
    }
  }
</style>
