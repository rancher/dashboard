import { APP_UPGRADE_STATUS } from '@shell/store/catalog';
import {
  REPO_TYPE, REPO, CHART, VERSION, _FLAGGED, HIDE_SIDE_NAV, CATEGORY, TAG, DEPRECATED as DEPRECATED_QUERY
} from '@shell/config/query-params';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { SHOW_PRE_RELEASE } from '@shell/store/prefs';
import { getLatestCompatibleVersion } from '@shell/utils/chart';
import SteveModel from '@shell/plugins/steve/steve-class';
import { CATALOG, ZERO_TIME } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import day from 'dayjs';

export default class Chart extends SteveModel {
  queryParams(from, hideSideNav) {
    const version = this.latestCompatibleVersion.version;

    const out = {
      [REPO_TYPE]: this.repoType,
      [REPO]:      this.repoName,
      [CHART]:     this.chartName,
      [VERSION]:   version,
    };

    if (this.deprecated) {
      out[DEPRECATED_QUERY] = true;
    }

    if ( from ) {
      out[from] = _FLAGGED;
    }

    if (hideSideNav) {
      out[HIDE_SIDE_NAV] = _FLAGGED;
    }

    return out;
  }

  goToInstall(from, clusterId, hideSideNav) {
    const query = this.queryParams(from, hideSideNav);
    const currentCluster = this.$rootGetters['currentCluster'];

    this.currentRouter().push({
      name:   'c-cluster-apps-charts-install',
      params: { cluster: clusterId || currentCluster?.id || BLANK_CLUSTER },
      query,
    });
  }

  /**
   * Returns the list of installed apps that match this chart by:
   * - chart name
   * - repository name
   * - and either:
   *   - the home URL matches the latest version’s home URL
   *   - or version + home URL match any other known version
   *
   * Inverse logic of `matchingCharts` in `catalog.cattle.io.app.js`.
   *
   * @returns {Array<Object>} List of matching installed app objects.
   */
  get matchingInstalledApps() {
    const latestVersion = this.versions?.[0] || [];
    const appHome = latestVersion?.home;
    const installedApps = this.$rootGetters['cluster/all'](CATALOG.APP);

    return installedApps.filter((installedApp) => {
      const metadata = installedApp?.spec?.chart?.metadata;
      const name = metadata?.name;
      const version = metadata?.version;
      const home = metadata?.home;

      const repoName = metadata?.annotations?.[CATALOG_ANNOTATIONS.SOURCE_REPO_NAME] ||
                       installedApp?.metadata?.labels?.[CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME];

      // name and repo should match
      if (name !== this.chartName || !repoName || repoName !== this.repoName) {
        return false;
      }

      // match by comparing home URL in the latest version vs home URL from the installed app
      if (appHome && home === appHome) {
        return true;
      }

      // match by version + home for the rest
      return this.versions?.some((v) => v.version === version && home === appHome);
    });
  }

  /**
   * Determines if the chart is installed by checking if exactly one matching installed app is found.
   *
   * @returns {boolean} `true` if the chart is currently installed.
   */
  get isInstalled() {
    return this.matchingInstalledApps.length === 1;
  }

  /**
   * Determines if the installed app has a single available upgrade.
   * Requires the chart to be installed.
   *
   * @returns {boolean} `true` if the app is installed and has a single upgrade available.
   */
  get upgradeable() {
    return this.isInstalled && this.matchingInstalledApps[0].upgradeAvailable === APP_UPGRADE_STATUS.SINGLE_UPGRADE;
  }

  /**
   * Retrieves the latest chart version that is compatible with the current cluster's OS and user's pre-release preference.
   * It caches the result for efficiency.
   *
   * @returns {Object} The latest compatible chart version object.
   */
  get latestCompatibleVersion() {
    if (this._latestCompatibleVersion) {
      return this._latestCompatibleVersion;
    }

    const currentCluster = this.$rootGetters['currentCluster'];
    const workerOSs = currentCluster?.workerOSs;
    const showPrerelease = this.$rootGetters['prefs/get'](SHOW_PRE_RELEASE);

    this._latestCompatibleVersion = getLatestCompatibleVersion(this, workerOSs, showPrerelease);

    return this._latestCompatibleVersion;
  }

  /**
   * Builds structured metadata for display in RcItemCard.vue:
   * - Sub-header (version and last updated)
   * - Footer (repository, categories, tags)
   * - Status indicators (e.g. deprecated, upgradeable, installed)
   *
   * @returns {Object} Card content object with `subHeaderItems`, `footerItems`, and `statuses` arrays.
   */
  get cardContent() {
    const latestVersion = this.latestCompatibleVersion;
    const subHeaderItems = [];

    if (latestVersion) {
      const hasZeroTime = latestVersion.created === ZERO_TIME;

      subHeaderItems.push({
        icon:        'icon-version-alt',
        iconTooltip: { key: 'tableHeaders.version' },
        label:       latestVersion.version
      });

      const lastUpdatedItem = {
        icon:        'icon-refresh-alt',
        iconTooltip: { key: 'tableHeaders.lastUpdated' },
        label:       hasZeroTime ? this.t('generic.na') : day(latestVersion.created).format('MMM D, YYYY')
      };

      if (hasZeroTime) {
        lastUpdatedItem.labelTooltip = this.t('catalog.charts.appChartCard.subHeaderItem.missingVersionDate');
      }

      subHeaderItems.push(lastUpdatedItem);
    }

    const footerItems = [
      {
        type:         REPO,
        icon:         'icon-repository-alt',
        iconTooltip:  { key: 'tableHeaders.repoName' },
        labels:       [this.repoNameDisplay],
        labelTooltip: this.t('catalog.charts.findSimilar.message', { type: this.t('catalog.charts.findSimilar.types.repo') }, true)
      }
    ];

    if (this.categories.length) {
      footerItems.push( {
        type:         CATEGORY,
        icon:         'icon-category-alt',
        iconTooltip:  { key: 'generic.category' },
        labels:       this.categories,
        labelTooltip: this.t('catalog.charts.findSimilar.message', { type: this.t('catalog.charts.findSimilar.types.category') }, true)
      });
    }

    if (this.tags.length) {
      footerItems.push({
        type:         TAG,
        icon:         'icon-tag-alt',
        iconTooltip:  { key: 'generic.tags' },
        labels:       this.tags,
        labelTooltip: this.t('catalog.charts.findSimilar.message', { type: this.t('catalog.charts.findSimilar.types.tag') }, true)
      });
    }

    const statuses = [];

    if (this.deprecated) {
      statuses.push({
        icon: 'icon-alert-alt', color: 'error', tooltip: { key: 'generic.deprecated' }
      });
    }

    if (this.upgradeable) {
      statuses.push({
        icon: 'icon-upgrade-alt', color: 'info', tooltip: { key: 'generic.upgradeable' }
      });
    }

    if (this.isInstalled) {
      const installedVersion = this.matchingInstalledApps[0]?.spec?.chart?.metadata?.version;

      statuses.push({
        icon: 'icon-confirmation-alt', color: 'success', tooltip: { text: `${ this.t('generic.installed') } (${ installedVersion })` }
      });
    }

    return {
      subHeaderItems,
      footerItems,
      statuses
    };
  }
}
