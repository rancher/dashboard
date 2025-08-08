<script>
import day from 'dayjs';
import { SEARCH_QUERY, VERSION } from '@shell/config/query-params';
import { DATE_FORMAT } from '@shell/store/prefs';
import { ZERO_TIME } from '@shell/config/types';
import { escapeHtml } from '@shell/utils/string';
import { compatibleVersionsFor } from '@shell/store/catalog';
import { Banner } from '@components/Banner';
import ChartReadme from '@shell/components/ChartReadme';
import LazyImage from '@shell/components/LazyImage';
import AppChartCardSubHeader from '@shell/pages/c/_cluster/apps/charts/AppChartCardSubHeader';
import AppChartCardFooter from '@shell/pages/c/_cluster/apps/charts/AppChartCardFooter';
import { RcButton } from '@components/RcButton';

export default {

  components: {
    Banner,
    ChartReadme,
    LazyImage,
    AppChartCardSubHeader,
    AppChartCardFooter,
    RcButton
  },

  emits: ['click:install', 'click:footer'],

  props: {
    currentCluster: {
      type:     Object,
      required: true
    },

    repoType: {
      type:     String,
      required: true
    },
    repoName: {
      type:     String,
      required: true
    },
    chartName: {
      type:     String,
      required: true
    },
    versionName: {
      type:     String,
      required: true
    },
    repo: {
      type:    Object,
      default: () => ({})
    },
    chart: {
      type:    Object,
      default: () => ({})
    },
    existing: {
      type:    Object,
      default: () => ({})
    },
    mappedVersions: {
      type:    Array,
      default: () => []
    },
    version: {
      type:    Object,
      default: () => ({})
    },
    targetVersion: {
      type:    String,
      default: ''
    },
    currentVersion: {
      type:    String,
      default: ''
    },
    requires: {
      type:    Array,
      default: () => []
    },
    warnings: {
      type:    Array,
      default: () => []
    },
    versionInfo: {
      type:    Object,
      default: () => ({})
    },
    versionInfoError: {
      type:    String,
      default: ''
    },
    showPreRelease: {
      type:    Boolean,
      default: false
    },
    hasReadme: {
      type:    Boolean,
      default: false
    },
    action: {
      type:    String,
      default: ''
    },
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
    headerContent() {
      return this.chart.cardContent;
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

      return maintainers.map((m) => {
        return {
          id:   m.name,
          text: m.name,
          url:  m.email ? `mailto:${ m.email }` : m.url
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
      if (!this.chart) {
        return '';
      }

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

  methods: {
    clickInstall() {
      this.$emit('click:install', {
        repoType:    this.repoType,
        repoName:    this.repoName,
        chartName:   this.chartName,
        versionName: this.versionName,
      });
    },
    clickFooter(type, value) {
      this.$emit('click:footer', { type, value });
    },
    formatVersionDate(date) {
      if (date === ZERO_TIME) {
        return this.t('generic.na');
      }

      return day(date).format('MMM D, YYYY');
    },
    getVersionDateTooltip(date) {
      if (date === ZERO_TIME) {
        return this.t('generic.missingInfoMessage');
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
  <main>
    <Banner
      v-if="versionInfoError"
      color="error"
      :label="versionInfoError"
    />
    <Banner
      v-if="warningMessage"
      color="warning"
      :label="warningMessage"
      data-testid="deprecation-and-experimental-banner"
    />
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
                v-clean-tooltip="t(status.tooltip.key)"
                :class="['icon', status.icon, status.color]"
                :style="{color: status.customColor}"
                role="img"
                :aria-label="t(status.tooltip.key)"
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
            :items="headerContent.footerItems"
            @click:item="clickFooter"
          />
        </div>
      </div>
      <RcButton
        v-if="!requires?.length"
        data-testid="btn-chart-install"
        class="btn role-primary"
        @click.prevent="clickInstall"
      >
        <i
          v-if="action === 'upgrade'"
          class="icon icon-upgrade-alt mmr-2"
        />
        {{ t(`asyncButton.${action}.action` ) }}
      </RcButton>
    </div>

    <div class="dashed-spacer" />

    <div
      v-if="requires?.length || warnings.length || targetedAppWarning || osWarning"
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
        :key="i"
        color="error"
      >
        <span v-clean-html="msg" />
      </Banner>

      <Banner
        v-for="(msg, i) in warnings"
        :key="i"
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

    <div class="chart-body">
      <ChartReadme
        v-if="hasReadme"
        :version-info="versionInfo"
        :show-app-readme="false"
        :hide-readme-first-title="false"
        class="chart-body__readme"
      />
      <div
        v-else
        class="chart-body__readme"
      >
        {{ t('catalog.install.appReadmeMissing', {}, true) }}
      </div>
      <aside
        v-if="version"
        class="chart-body__info"
      >
        <div class="chart-body__info-section">
          <h4>{{ t('catalog.chart.info.chartVersions.label') }}</h4>
          <div
            v-for="vers of versions"
            :key="vers.id"
            class="chart-body__info-section--versions"
            data-testid="chart-versions"
          >
            <b
              v-if="vers.originalVersion === version.version"
              v-clean-tooltip="vers.label"
              class="current-version"
            >
              <template v-if="vers.originalVersion === currentVersion">
                <span class="ellipsis">{{ currentVersion }}</span>
                <i class="icon icon-confirmation-alt" />
              </template>
              <span
                v-else
                class="ellipsis"
              >
                {{ vers.originalVersion }}
              </span>
            </b>
            <div
              v-else
              class="current-version"
            >
              <router-link
                v-clean-tooltip="vers.label"
                :to="getVersionRoute(vers)"
                class="ellipsis"
                data-testid="chart-version-link"
              >
                {{ vers.originalVersion === currentVersion ? currentVersion : vers.originalVersion }}
              </router-link>
              <i
                v-if="vers.originalVersion === currentVersion"
                class="icon icon-confirmation-alt"
              />
            </div>
            <p
              v-clean-tooltip="{ content: getVersionDateTooltip(vers.created), placement: 'left'}"
              class="version-date"
            >
              {{ formatVersionDate(vers.created) }}
            </p>
          </div>
          <a
            v-if="mappedVersions.length > showLastVersions"
            href="#"
            role="button"
            class="mmt-1 secondary-text-link"
            data-testid="chart-show-more-versions"
            @click.prevent="showMoreVersions = !showMoreVersions"
          >
            {{ t(`catalog.chart.info.chartVersions.${showMoreVersions ? 'showLess' : 'showMore'}`) }}
          </a>
        </div>
        <div
          v-if="appVersion"
          class="chart-body__info-section"
        >
          <h4>{{ t('catalog.chart.info.appVersion') }}</h4>
          {{ appVersion }}
        </div>
        <div
          v-if="repo"
          class="chart-body__info-section"
        >
          <h4>{{ t('catalog.chart.info.repository') }}</h4>
          <router-link
            :to="repo.detailLocation"
            data-testid="chart-repo-link"
          >
            {{ chart.repoNameDisplay }}
          </router-link>
        </div>
        <div
          v-if="home"
          class="chart-body__info-section"
        >
          <h4>{{ t('catalog.chart.info.home') }}</h4>
          <a
            :href="home"
            rel="nofollow noopener noreferrer"
            target="_blank"
            data-testid="chart-home-link"
          >{{ home }}<i class="icon icon-external-link" /><span class="sr-only">{{ t('generic.opensInNewTab') }}</span></a>
        </div>
        <div
          v-if="maintainers.length"
          class="chart-body__info-section"
        >
          <h4>{{ t('catalog.chart.info.maintainers') }}</h4>
          <a
            v-for="m of maintainers"
            :key="m.id"
            :href="m.url"
            rel="nofollow noopener noreferrer"
            target="_blank"
          >{{ m.text }}<span class="sr-only">{{ t('generic.opensInNewTab') }}</span></a>
        </div>
        <div
          v-if="version.sources"
          class="chart-body__info-section"
        >
          <h4>{{ t('catalog.chart.info.related') }}</h4>
          <a
            v-for="s of version.sources"
            :key="s"
            :href="s"
            rel="nofollow noopener noreferrer"
            target="_blank"
          >{{ s }}<i class="icon icon-external-link" /><span class="sr-only">{{ t('generic.opensInNewTab') }}</span></a>
        </div>
        <div
          v-if="version.urls"
          class="chart-body__info-section"
        >
          <h4>{{ t('catalog.chart.info.chartUrls') }}</h4>
          <a
            v-for="url of version.urls"
            :key="url"
            :href="url"
            rel="nofollow noopener noreferrer"
            target="_blank"
          >{{ version.urls.length === 1 ? 'Download': url }}<span class="sr-only">{{ t('generic.opensInNewTab') }}</span></a>
        </div>
        <div
          v-if="version.keywords"
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
      </aside>
    </div>
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

  .chart-body {
    display: flex;
    &__readme {
      flex: 1;
      min-width: 400px;
      padding: 12px 24px;
    }
    &__info {
      min-width: 300px;
      max-width: 300px;
      height: max-content;
      background: var(--sortable-table-header-bg);
      padding: 16px;
      border-radius: 8px;
      margin-left: 24px;

      &-section {
        display: flex;
        flex-direction: column;
        padding-bottom: 24px;
        word-break: break-all;
        line-height: 21px;

        h4 {
          font-weight: bold;
        }

        a {
          cursor: pointer;

          .icon-external-link {
            margin-left: 8px;
          }
        }

        &--versions{
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;

          .version-date {
            color: var(--link-text-secondary);
          }

          .current-version {
            display: flex;
            align-items: center;

            .ellipsis {
              display: block;
              max-width: 140px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .icon-confirmation-alt {
              color: var(--success);
              margin-left: 12px;
              font-size: 19px;
            }
          }
        }

        &--keywords{
          color: var(--link-text-secondary);
          padding-bottom: 0;

          .keyword-links {
            .keyword-item {
              display: inline-block;
              white-space: nowrap;

              span {
                margin-right: 4px;
                margin-left: -2px;
              }
            }
          }
        }
      }
    }
  }
</style>
