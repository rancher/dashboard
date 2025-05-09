import { compatibleVersionsFor, APP_UPGRADE_STATUS } from '@shell/store/catalog';
import {
  REPO_TYPE, REPO, CHART, VERSION, _FLAGGED, HIDE_SIDE_NAV
} from '@shell/config/query-params';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import SteveModel from '@shell/plugins/steve/steve-class';
import { CATALOG } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import day from 'dayjs';

export default class Chart extends SteveModel {
  queryParams(from, hideSideNav) {
    let version;
    const chartVersions = this.versions;
    const currentCluster = this.$rootGetters['currentCluster'];
    const workerOSs = currentCluster?.workerOSs;
    const compatibleVersions = compatibleVersionsFor(this, workerOSs);

    if (compatibleVersions.length) {
      version = compatibleVersions[0].version;
    } else {
      version = chartVersions[0].version;
    }

    const out = {
      [REPO_TYPE]: this.repoType,
      [REPO]:      this.repoName,
      [CHART]:     this.chartName,
      [VERSION]:   version,
    };

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

  // This works as the inverted version of "matchingCharts" in shell/models/catalog.cattle.io.app.js
  get matchingInstalledApps() {
    const [latestVersion, ...otherVersions] = this.versions || [];
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
      return otherVersions.some((v) => v.version === version && home === appHome);
    });
  }

  get isInstalled() {
    // when there's only one match, we know we found the best match
    return this.matchingInstalledApps.length === 1;
  }

  get upgradeable() {
    return this.isInstalled && this.matchingInstalledApps[0].upgradeAvailable === APP_UPGRADE_STATUS.SINGLE_UPGRADE;
  }

  get statuses() {
    const res = [];

    if (this.deprecated) {
      res.push({
        icon: 'icon-error', color: 'error', tooltip: { key: 'generic.deprecated' }, id: this.chartName
      });
    }

    if (this.upgradeable) {
      res.push({
        icon: 'icon-error', color: 'info', tooltip: { key: 'generic.upgradeable' }, id: this.chartName
      });
    }

    if (this.isInstalled) {
      res.push({
        icon: 'icon-error', color: 'success', tooltip: { key: 'generic.installed' }, id: this.chartName
      });
    }

    return res;
  }

  get subTitleGroups() {
    const version = {
      icon:        'icon-error',
      iconTooltip: { key: 'tableHeaders.version' },
      labels:      [{ text: this.versions[0].version }]
    };

    const refresh = {
      icon:        'icon-error',
      iconTooltip: { key: 'generic.refresh' },
      labels:      [{ text: day(this.versions[0].created).format('MMM D, YYYY') }]
    };

    return [version, refresh];
  }

  get bottomGroups() {
    const repo = {
      icon:        'icon-error',
      iconTooltip: { key: 'tableHeaders.repoName' },
      labels:      [{ text: this.repoNameDisplay }]
    };
    const categories = {
      icon:        'icon-error',
      iconTooltip: { key: 'generic.category' },
      labels:      this.categories?.map((c) => ({ text: c }))
    };
    const tags = {
      icon:        'icon-error',
      iconTooltip: { key: 'generic.tags' },
      labels:      this.tags?.map((t) => ({ text: t }))
    };

    return [repo, categories, tags];
  }
}
