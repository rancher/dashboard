import {
  NAMESPACE, NAME, REPO, REPO_TYPE, CHART, VERSION, _VIEW, FROM_TOOLS, _FLAGGED
} from '@/config/query-params';
import { CATALOG as CATALOG_ANNOTATIONS, FLEET } from '@/config/labels-annotations';
import { compare, isPrerelease, sortable } from '@/utils/version';
import { filterBy } from '@/utils/array';
import { CATALOG, MANAGEMENT, NORMAN } from '@/config/types';
import { SHOW_PRE_RELEASE } from '@/store/prefs';
import { set } from '@/utils/object';

import SteveModel from '@/plugins/steve/steve-class';

export default class CatalogApp extends SteveModel {
  showMasthead(mode) {
    return mode === _VIEW;
  }

  applyDefaults() {
    set(this, 'disableOpenApiValidation', false);
    set(this, 'noHooks', false);
    set(this, 'skipCRDs', false);
    set(this, 'timeout', 300);
    set(this, 'wait', true);
  }

  get _availableActions() {
    const out = super._availableActions;

    const upgrade = {
      action:     'goToUpgrade',
      enabled:    true,
      icon:       'icon icon-fw icon-edit',
      label:      this.t('catalog.install.action.goToUpgrade'),
    };

    out.unshift(upgrade);

    return out;
  }

  matchingChart(includeHidden) {
    const chart = this.spec?.chart;

    if ( !chart ) {
      return;
    }

    const chartName = chart.metadata?.name;
    const preferRepoType = chart.metadata?.annotations?.[CATALOG_ANNOTATIONS.SOURCE_REPO_TYPE];
    const preferRepoName = chart.metadata?.annotations?.[CATALOG_ANNOTATIONS.SOURCE_REPO_NAME];
    const match = this.$rootGetters['catalog/chart']({
      chartName,
      preferRepoType,
      preferRepoName,
      includeHidden
    });

    return match;
  }

  get currentVersion() {
    return this.spec?.chart?.metadata?.version;
  }

  get upgradeAvailable() {
    // false = does not apply (managed by fleet)
    // null = no upgrade found
    // object = version available to upgrade to

    if ( this.spec?.chart?.metadata?.annotations?.[FLEET.BUNDLE_ID] ) {
      // Things managed by fleet shouldn't show ugrade available even if there might be.
      return false;
    }

    const chart = this.matchingChart(false);

    if ( !chart ) {
      return null;
    }

    const isWindows = this.$rootGetters['currentCluster'].providerOs === 'windows';
    const showPreRelease = this.$rootGetters['prefs/get'](SHOW_PRE_RELEASE);

    const thisVersion = this.spec?.chart?.metadata?.version;
    let versions = chart.versions;

    if (!showPreRelease) {
      versions = chart.versions.filter(v => !isPrerelease(v.version));
    }

    const newestChart = versions?.[0];
    const newestVersion = newestChart?.version;

    if ( !thisVersion || !newestVersion ) {
      return null;
    }

    if (isWindows && newestChart?.annotations?.['catalog.cattle.io/os'] === 'linux') {
      return null;
    } else if (!isWindows && newestChart?.annotations?.['catalog.cattle.io/os'] === 'windows') {
      return null;
    }

    if ( this.deployedAsLegacy || this.deployedAsMultiCluster ) {
      return null;
    }

    if ( compare(thisVersion, newestVersion) < 0 ) {
      return cleanupVersion(newestVersion);
    }

    return null;
  }

  get upgradeAvailableSort() {
    const version = this.upgradeAvailable;

    if ( !version ) {
      return '~'; // Tilde sorts after all numbers and letters
    }

    return sortable(version);
  }

  goToUpgrade(forceVersion, fromTools) {
    const match = this.matchingChart(true);
    const versionName = this.spec?.chart?.metadata?.version;
    const query = {
      [NAMESPACE]: this.metadata.namespace,
      [NAME]:      this.metadata.name,
      [VERSION]:   forceVersion || versionName,
    };

    if ( match ) {
      query[REPO] = match.repoName;
      query[REPO_TYPE] = match.repoType;
      query[CHART] = match.chartName;
    }

    if ( fromTools ) {
      query[FROM_TOOLS] = _FLAGGED;
    }

    this.currentRouter().push({
      name:   'c-cluster-apps-charts-install',
      params: {
        product:   this.$rootGetters['productId'],
        cluster:   this.$rootGetters['clusterId'],
      },
      query,
    });
  }

  get details() {
    const t = this.$rootGetters['i18n/t'];

    const first = this.spec?.info?.firstDeployed;
    const last = this.spec?.info?.lastDeployed;

    if ( first && last && first !== last ) {
      return [
        {
          label:     t('model."catalog.cattle.io.app".lastDeployed'),
          formatter: 'LiveDate',
          content:   last,
        },
      ];
    }

    return [];
  }

  get nameDisplay() {
    const out = this.spec?.name || this.metadata?.name || this.id || '';

    return out;
  }

  get chartDisplay() {
    const name = this.spec?.chart?.metadata?.name || '?';

    return `${ name }:${ this.versionDisplay }`;
  }

  get versionDisplay() {
    return cleanupVersion(this.spec?.chart?.metadata?.version);
  }

  get versionSort() {
    return sortable(this.versionDisplay);
  }

  async remove(opt = {}) {
    const res = await this.doAction('uninstall', opt);

    const operation = await this.$dispatch('find', {
      type: CATALOG.OPERATION,
      id:   `${ res.operationNamespace }/${ res.operationName }`
    });

    try {
      await operation.waitForLink('logs');
      operation.openLogs();
    } catch (e) {
      // The wait times out eventually, move on...
    }
  }

  get canDelete() {
    return this.hasAction('uninstall');
  }

  get deployedResources() {
    return filterBy(this.metadata?.relationships || [], 'rel', 'helmresource');
  }

  get deployedAsMultiCluster() {
    return async() => {
      try {
        const mcapps = await this.$dispatch('management/findAll', { type: MANAGEMENT.MULTI_CLUSTER_APP }, { root: true })
          .catch(() => {
            throw new Error("You don't have permission to list multi-cluster apps");
          });

        if (mcapps) {
          return mcapps.find(mcapp => mcapp.spec?.targets?.find(target => target.appName === this.metadata?.name));
        }
      } catch (e) {}

      return false;
    };
  }

  get deployedAsLegacy() {
    return async() => {
      if (this.spec.values) {
        const { clusterName, projectName } = this.spec?.values?.global;

        if (clusterName && projectName) {
          try {
            const legacyApp = await this.$dispatch('rancher/find', {
              type: NORMAN.APP,
              id:   `${ projectName }:${ this.metadata?.name }`,
              opt:  { url: `/v3/project/${ clusterName }:${ projectName }/apps/${ projectName }:${ this.metadata?.name }` }
            }, { root: true });

            if (legacyApp) {
              return legacyApp;
            }
          } catch (e) {}
        }
      }

      return false;
    };
  }
}

function cleanupVersion(version) {
  if ( !version ) {
    return '?';
  }

  if ( version.match(/^v/i) ) {
    version = version.substr(1);
  }

  const hash = version.match(/[0-9a-f]{32,}/);

  if ( hash ) {
    version = version.replace(hash[0], hash[0].substr(0, 7));
  }

  return version;
}
