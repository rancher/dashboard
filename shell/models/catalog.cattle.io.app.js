import {
  NAMESPACE, NAME, REPO, REPO_TYPE, CHART, VERSION, _VIEW, FROM_TOOLS, _FLAGGED
} from '@shell/config/query-params';
import { CATALOG as CATALOG_ANNOTATIONS, FLEET } from '@shell/config/labels-annotations';
import { compare, isPrerelease, sortable } from '@shell/utils/version';
import { filterBy } from '@shell/utils/array';
import { CATALOG, MANAGEMENT, NORMAN, SECRET } from '@shell/config/types';
import { SHOW_PRE_RELEASE } from '@shell/store/prefs';
import { set } from '@shell/utils/object';

import SteveModel from '@shell/plugins/steve/steve-class';
import { compatibleVersionsFor, APP_UPGRADE_STATUS } from '@shell/store/catalog';

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
    set(this, 'upgradeAvailableVersion', '');
  }

  get _availableActions() {
    const out = super._availableActions;

    const upgrade = {
      action:  'goToUpgrade',
      enabled: true,
      icon:    'icon icon-fw icon-edit',
      label:   this.t('catalog.install.action.goToUpgrade'),
    };

    out.unshift(upgrade);

    return out;
  }

  get warnDeletionMessage() {
    if (this.upgradeAvailable === APP_UPGRADE_STATUS.NOT_APPLICABLE) {
      const manager = this.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.MANAGED] || 'Rancher';

      return this.t('catalog.delete.warning.managed', { manager: manager === 'true' ? 'Rancher' : manager, name: this.name });
    }

    return null;
  }

  /**
   * Finds matching charts based on the current chart's name, repository, and other attributes.
   * The function filters out charts that do not meet specific criteria, including version and home value matches.
   *
   * @param includeHidden - Whether to include hidden charts in the search.
   * @returns An array of matching chart objects that meet the specified criteria.
  */
  matchingCharts(includeHidden) {
    const chart = this.spec?.chart;

    if ( !chart ) {
      return [];
    }

    const chartName = chart.metadata?.name;
    const repoName = chart.metadata?.annotations?.[CATALOG_ANNOTATIONS.SOURCE_REPO_NAME] || this.metadata?.labels?.[CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME];

    const matchingCharts = this.$rootGetters['catalog/chart']({
      chartName,
      repoName,
      includeHidden,
      multiple: true
    }) || [];

    if (matchingCharts.length === 0) {
      return [];
    }

    // Filtering matches by verifying if the current version is in the matched chart's available versions, and that the home value matches as well
    const thisHome = chart?.metadata?.home;
    const bestMatches = matchingCharts.filter(({ versions }) => {
      // First checking if the latest version has the same home value
      if (thisHome === versions[0]?.home) {
        return true;
      }

      for (let i = 1; i < versions.length; i++) {
        const { version, home } = versions[i];

        // Finding the exact version, if the version is not there, then most likely it's not a match
        // if the exact version is found, then we can compare the home value
        if (version === this.currentVersion && (home === thisHome)) {
          return true;
        }
      }

      return false;
    });

    return bestMatches;
  }

  get currentVersion() {
    return this.spec?.chart?.metadata?.version;
  }

  get upgradeAvailable() {
    // one of the following statuses gets returned:
    // NOT_APPLICABLE - managed by fleet
    // NO_UPGRADE - no upgrade found
    // SINGLE_UPGRADE - a version available to upgrade to
    // MULTIPLE_UPGRADES - more than one match found

    if (
      this.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.MANAGED] ||
      this.spec?.chart?.metadata?.annotations?.[FLEET.BUNDLE_ID]
    ) {
      // Things managed by fleet shouldn't show upgrade available even if there might be.
      return APP_UPGRADE_STATUS.NOT_APPLICABLE;
    }

    const charts = this.matchingCharts(false);

    if (charts.length === 0) {
      return APP_UPGRADE_STATUS.NO_UPGRADE;
    }

    // Handle single chart logic
    if (charts.length === 1) {
      return this.evaluateUpgradeForChart(charts[0]);
    }

    // Handle multiple upgrade matches
    return this.handleMultipleUpgradeMatches(charts);
  }

  /**
   * Evaluates upgrade status for a single chart.
   */
  evaluateUpgradeForChart(chart) {
    const workerOSs = this.$rootGetters['currentCluster'].workerOSs;
    const showPreRelease = this.$rootGetters['prefs/get'](SHOW_PRE_RELEASE);

    let versions = chart.versions;

    if (!showPreRelease) {
      versions = chart.versions.filter((v) => !isPrerelease(v.version));
    }

    versions = compatibleVersionsFor(chart, workerOSs, showPreRelease);

    const newestChart = versions?.[0];
    const newestVersion = newestChart?.version;

    if (!this.currentVersion || !newestVersion) {
      return APP_UPGRADE_STATUS.NO_UPGRADE;
    }

    if (compare(this.currentVersion, newestVersion) < 0) {
      // Set the available upgrade version to be used in other places
      this.upgradeAvailableVersion = cleanupVersion(newestVersion);

      return APP_UPGRADE_STATUS.SINGLE_UPGRADE;
    }

    return APP_UPGRADE_STATUS.NO_UPGRADE;
  }

  /**
   * Handles the case where multiple upgrade matches are found.
   * @param charts - Array of matching charts
   */
  handleMultipleUpgradeMatches(charts) {
    const qualifiedCharts = [];

    for (const chart of charts) {
      const status = this.evaluateUpgradeForChart(chart);

      if (status === APP_UPGRADE_STATUS.SINGLE_UPGRADE) {
        qualifiedCharts.push(chart);
      }
    }

    if (qualifiedCharts.length > 1) {
      return APP_UPGRADE_STATUS.MULTIPLE_UPGRADES;
    }

    if (qualifiedCharts.length === 1) {
      const newestVersion = qualifiedCharts[0]?.versions?.[0]?.version;

      this.upgradeAvailableVersion = cleanupVersion(newestVersion);

      return APP_UPGRADE_STATUS.SINGLE_UPGRADE;
    }

    return APP_UPGRADE_STATUS.NO_UPGRADE;
  }

  get upgradeAvailableSort() {
    if (this.upgradeAvailable === APP_UPGRADE_STATUS.SINGLE_UPGRADE) {
      return sortable(this.upgradeAvailableVersion);
    }

    return '~'; // Tilde sorts after all numbers and letters
  }

  get currentVersionCompatible() {
    const workerOSs = this.$rootGetters['currentCluster'].workerOSs;

    const chart = this.matchingCharts(false)[0];

    if (!chart) {
      return true;
    }

    const versionInChart = chart.versions.find((version) => version.version === this.currentVersion);

    if (!versionInChart) {
      return true;
    }
    const compatibleVersions = compatibleVersionsFor(chart, workerOSs, true) || [];

    const thisVersionCompatible = !!compatibleVersions.find((version) => version.version === this.currentVersion);

    return thisVersionCompatible;
  }

  get stateDescription() {
    if (this.currentVersionCompatible) {
      return null;
    }
    if (this.upgradeAvailableVersion) {
      return this.t('catalog.os.versionIncompatible');
    }

    return this.t('catalog.os.chartIncompatible');
  }

  goToUpgrade(forceVersion, fromTools) {
    const match = this.matchingCharts(true)[0];
    const query = {
      [NAMESPACE]: this.metadata.namespace,
      [NAME]:      this.metadata.name,
      [VERSION]:   forceVersion || this.currentVersion,
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
        product: this.$rootGetters['productId'],
        cluster: this.$rootGetters['clusterId'],
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
    return cleanupVersion(this.currentVersion);
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

  get relatedResourcesToRemove() {
    return async() => {
      const crd = this.spec.chart.metadata.annotations[CATALOG_ANNOTATIONS.AUTO_INSTALL].replace('=match', '');

      return await this.$dispatch('find', {
        type: CATALOG.APP,
        id:   `${ this.metadata.namespace }/${ crd }`
      });
    };
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
          return mcapps.find((mcapp) => mcapp.spec?.targets?.find((target) => target.appName === this.metadata?.name));
        }
      } catch (e) {}

      return false;
    };
  }

  async deployedAsLegacy() {
    await this.fetchValues();

    if (this.values?.global) {
      const { clusterName, projectName } = this.values.global;

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
  }

  /**
   * User and Chart values live in a helm secret, so fetch it (with special param)
   */
  async fetchValues(force = false) {
    if (!this.secretId) {
      // If there's no secret id this isn't ever going to work, no need to carry on
      return;
    }

    const haveValues = !!this._values && !!this._chartValues;

    if (haveValues && !force) {
      // If we already have the required values and we're not forced to re-fetch, no need to carry on
      return;
    }

    try {
      await this.$dispatch('find', {
        type: SECRET,
        id:   this.secretId,
        opt:  {
          force:  force || (!!this._secret && !haveValues), // force if explicitly requested or there's ean existing secret without the required values we have a secret without the values in (Secret has been fetched another way)
          watch:  false, // Cannot watch with custom params (they are dropped on calls made when resyncing over socket)
          params: { includeHelmData: true }
        }
      });
    } catch (e) {
      console.error(`Cannot find values for ${ this.id } (unable to fetch)`, e); // eslint-disable-line no-console
    }
  }

  get secretId() {
    const metadata = this.metadata;
    const secretReference = metadata.ownerReferences?.find((ow) => ow.kind.toLowerCase() === SECRET);

    const secretId = secretReference?.name;
    const secretNamespace = metadata.namespace;

    if (!secretNamespace || !secretId) {
      console.warn(`Cannot find values for ${ this.id } (cannot find related secret namespace or id)`); // eslint-disable-line no-console

      return null;
    }

    return `${ secretNamespace }/${ secretId }`;
  }

  get _secret() {
    return this.secretId ? this.$getters['byId'](SECRET, this.secretId) : null;
  }

  _validateSecret(noun) {
    if (this._secret === undefined) {
      throw new Error(`Cannot find ${ noun } for  ${ this.id } (chart secret has not been fetched via app \`fetchValues\`)`);
    }

    if (this._secret === null) {
      throw new Error(`Cannot find ${ noun } for ${ this.id } (chart secret cannot or has failed to fetch) `);
    }
  }

  /**
   * The user's helm values
   */
  get values() {
    this._validateSecret('values');

    return this._values;
  }

  get _values() {
    return this._secret?.data?.release?.config;
  }

  /**
   * The Charts default helm values
   */
  get chartValues() {
    this._validateSecret('chartValues');

    return this._chartValues;
  }

  get _chartValues() {
    return this._secret?.data?.release?.chart?.values;
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
