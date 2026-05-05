<script>
import Loading from '@shell/components/Loading';
import ChartMixin from '@shell/mixins/chart';
import { Banner } from '@components/Banner';
import ChartReadme from '@shell/components/ChartReadme';
import LazyImage from '@shell/components/LazyImage';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import isEqual from 'lodash/isEqual';
import {
  CHART, REPO, REPO_TYPE, VERSION, SEARCH_QUERY, CATEGORY, TAG, DEPRECATED, NAMESPACE, NAME, NEW_APP_INSTANCE, _FLAGGED
} from '@shell/config/query-params';
import { DATE_FORMAT } from '@shell/store/prefs';
import { isMissingDate } from '@shell/utils/time';
import { escapeHtml } from '@shell/utils/string';
import { mapGetters } from 'vuex';
import { APP_UPGRADE_STATUS, compatibleVersionsFor } from '@shell/store/catalog';
import { compareChartVersions } from '@shell/utils/chart';
import AppChartCardSubHeader from '@shell/pages/c/_cluster/apps/charts/AppChartCardSubHeader';
import AppChartCardFooter from '@shell/pages/c/_cluster/apps/charts/AppChartCardFooter';
import day from 'dayjs';
import { RcButton } from '@components/RcButton';
import { RcButtonSplit } from '@components/RcButtonSplit';
import { RcDropdownItem } from '@components/RcDropdown';

export default {
  components: {
    Banner,
    ChartReadme,
    LazyImage,
    Loading,
    LabeledSelect,
    AppChartCardSubHeader,
    AppChartCardFooter,
    RcButton,
    RcButtonSplit,
    RcDropdownItem
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
      showLastVersions:       7,
      showMoreVersions:       false,
      selectedInstalledAppId: null,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    headerContent() {
      const cardContent = this.chart.cardContent;

      // Override statuses based on selected installed app for the detail page
      const statuses = this.computeSelectedAppStatuses(cardContent.statuses);

      return {
        ...cardContent,
        statuses,
        subHeaderItems: cardContent.subHeaderItems.map((item, i) => i === 0 ? ({
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
    },

    /**
     * Returns the currently selected installed app.
     * Falls back to this.existing (set by the mixin for targeted charts or URL query params).
     */
    selectedInstalledApp() {
      if (this.selectedInstalledAppId) {
        return this.installedInstances?.find((app) => app.id === this.selectedInstalledAppId) || null;
      }

      return this.existing || null;
    },

    /**
     * Returns the action for the current state based on the selected app and target version.
     */
    currentAction() {
      const app = this.selectedInstalledApp;

      if (!app) {
        return { tKey: 'install', icon: 'plus' };
      }

      const installedVersion = app.spec?.chart?.metadata?.version;

      if (installedVersion === this.targetVersion) {
        return { tKey: 'edit', icon: 'edit' };
      }

      if (compareChartVersions(installedVersion, this.targetVersion) < 0) {
        return { tKey: 'upgrade', icon: 'upgrade-alt' };
      }

      return { tKey: 'downgrade', icon: 'downgrade-alt' };
    },

    /**
     * Returns options for the installed apps selector dropdown.
     * Adds "(Upgradeable)" suffix to apps that have an upgrade available.
     */
    installedAppOptions() {
      return (this.installedInstances || []).map((app) => {
        const isUpgradeable = app.upgradeAvailable === APP_UPGRADE_STATUS.SINGLE_UPGRADE;
        const baseName = `${ app?.metadata?.namespace }/${ app?.metadata?.name }`;

        return {
          value: app.id,
          label: isUpgradeable ? `${ baseName } (${ this.t('generic.upgradeable').toLowerCase() })` : baseName
        };
      });
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
    isMissingDate,
    /**
     * Computes statuses for the chart detail page based on the selected installed app.
     * When an app is selected, shows instance-specific installed/upgradeable status.
     * When no app is selected (fresh install), returns only deprecated status if applicable.
     *
     * @param {Array} defaultStatuses - The default statuses from chart.cardContent
     * @returns {Array} Statuses array for the selected app context
     */
    computeSelectedAppStatuses(defaultStatuses) {
      const statuses = [];

      // Always include deprecated status if present
      const deprecatedStatus = defaultStatuses.find((s) => s.icon === 'icon-alert-alt');

      if (deprecatedStatus) {
        statuses.push(deprecatedStatus);
      }

      const selectedApp = this.selectedInstalledApp;

      if (!selectedApp) {
        // No app selected - fresh install, no installed/upgradeable status
        return statuses;
      }

      // Check if the selected app is upgradeable
      const isUpgradeable = selectedApp.upgradeAvailable === APP_UPGRADE_STATUS.SINGLE_UPGRADE;

      if (isUpgradeable) {
        statuses.push({
          icon: 'icon-upgrade-alt', color: 'info', tooltip: { key: 'generic.upgradeable' }
        });
      }

      // Add installed status with version for the selected app
      const installedVersion = selectedApp.spec?.chart?.metadata?.version;

      statuses.push({
        icon: 'icon-confirmation-alt', color: 'success', tooltip: { text: `${ this.t('generic.installed') } (${ installedVersion })` }
      });

      return statuses;
    },

    /**
     * Navigate to install page for the currently selected installed app (edit/upgrade/downgrade).
     */
    executeAction() {
      const app = this.selectedInstalledApp;
      const query = {
        [REPO_TYPE]:  this.query.repoType,
        [REPO]:       this.query.repoName,
        [CHART]:      this.query.chartName,
        [VERSION]:    this.query.versionName,
        [DEPRECATED]: this.query.deprecated,
      };

      // If editing an existing app, include namespace and name in query
      if (app) {
        query[NAMESPACE] = app.metadata.namespace;
        query[NAME] = app.metadata.name;
      }

      this.$router.push({
        name:   'c-cluster-apps-charts-install',
        params: {
          cluster: this.$route.params.cluster,
          product: this.$store.getters['productId'],
        },
        query
      });
    },

    /**
     * Navigate to install page to create a new instance of this chart.
     * Uses NEW_APP_INSTANCE flag to enable version selection in the install wizard.
     */
    installNewInstance() {
      this.$router.push({
        name:   'c-cluster-apps-charts-install',
        params: {
          cluster: this.$route.params.cluster,
          product: this.$store.getters['productId'],
        },
        query: {
          [REPO_TYPE]:        this.query.repoType,
          [REPO]:             this.query.repoName,
          [CHART]:            this.query.chartName,
          [DEPRECATED]:       this.query.deprecated,
          [NEW_APP_INSTANCE]: _FLAGGED,
        }
      });
    },

    /**
     * Handle installed app selection from the dropdown.
     * Updates selectedInstalledAppId and this.existing so the page reflects the current installed app and displays the correct information for the selected instance.
     */
    handleInstalledAppSelect(id) {
      this.selectedInstalledAppId = id;
      this.existing = this.installedInstances?.find((app) => app.id === id) ?? null;
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
      return day(date).format('MMM D, YYYY');
    },
    getVersionDateTooltip(date) {
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
      <div
        v-if="!requires.length"
        class="header-actions"
      >
        <LabeledSelect
          v-if="installedInstances.length > 1 && canInstallNew"
          :value="selectedInstalledApp?.id"
          :options="installedAppOptions"
          :clearable="false"
          :aria-label="t('catalog.chart.installedAppsSelector.ariaLabel')"
          class="installed-apps-selector"
          data-testid="installed-apps-selector"
          @update:value="handleInstalledAppSelect"
        />
        <!-- Split button: shown when chart is installed AND can be re-installed -->
        <RcButtonSplit
          v-if="selectedInstalledApp && canInstallNew"
          data-testid="btn-chart-install"
          size="large"
          :left-icon="currentAction.icon"
          @click="executeAction"
        >
          {{ t(`catalog.chart.chartButton.action.${currentAction.tKey}` ) }}
          <template #dropdownCollection>
            <RcDropdownItem @click="installNewInstance">
              <template #before>
                <i class="icon icon-plus" />
              </template>
              {{ t('catalog.chart.chartButton.action.installNew') }}
            </RcDropdownItem>
          </template>
        </RcButtonSplit>
        <!-- Simple button: shown when chart is not installed OR cannot be re-installed -->
        <RcButton
          v-else
          data-testid="btn-chart-install"
          size="large"
          :left-icon="currentAction.icon"
          @click.prevent="executeAction"
        >
          {{ t(`catalog.chart.chartButton.action.${currentAction.tKey}` ) }}
        </RcButton>
      </div>
    </div>

    <div class="dashed-spacer" />

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
              v-if="!isMissingDate(vers.created)"
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
        <div class="chart-body__info-section">
          <h4>{{ t('catalog.chart.info.maintainers') }}</h4>
          <template v-if="maintainers.length">
            <div
              v-for="m of maintainers"
              :key="m.id"
            >
              <a
                v-if="m.href"
                v-clean-tooltip="m.name ? t('catalog.chart.info.maintainerContactTooltip', { maintainer: m.name }) : undefined"
                :href="m.href"
                rel="nofollow noopener noreferrer"
                target="_blank"
              >
                {{ m.label }}
              </a>
              <span v-else>{{ m.label }}</span>
            </div>
          </template>
          <span v-else>{{ t('generic.unknown') }}</span>
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

    .header-actions {
      margin-left: auto;
      display: flex;
      align-items: flex-start;
      flex-shrink: 0;
      gap: 8px;

      .installed-apps-selector {
        width: 340px;
      }
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
