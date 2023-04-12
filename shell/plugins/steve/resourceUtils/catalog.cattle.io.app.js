import { compare, sortable, isPrerelease } from '@shell/utils/version';
import { filterBy } from '@shell/utils/array';
import { CATALOG as CATALOG_ANNOTATIONS, FLEET } from '@shell/config/labels-annotations';
import { SHOW_PRE_RELEASE } from '@shell/store/prefs';
import { compatibleVersionsFor } from '@shell/plugins/steve/storeUtils/catalog';

export function cleanupVersion(version) {
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

export function matchingChart(resource, includeHidden, findChart) {
  const chart = resource.spec?.chart;

  if ( !chart ) {
    return;
  }

  const chartName = chart.metadata?.name;
  const preferRepoType = chart.metadata?.annotations?.[CATALOG_ANNOTATIONS.SOURCE_REPO_TYPE];
  const preferRepoName = chart.metadata?.annotations?.[CATALOG_ANNOTATIONS.SOURCE_REPO_NAME];

  return findChart({
    chartName,
    preferRepoType,
    preferRepoName,
    includeHidden
  });
}

export function _getNameDisplay(resource) {
  const out = resource.spec?.name || resource.metadata?.name || resource.id || '';

  return out;
}

export function _getVersionDisplay(resource) {
  return cleanupVersion(resource.spec?.chart?.metadata?.version);
}

export function _getChartDisplay(resource) {
  const name = resource.spec?.chart?.metadata?.name || '?';

  return `${ name }:${ resource.versionDisplay }`;
}

export function _getVersionSort(resource) {
  return sortable(resource.versionDisplay);
}

export function _getUpgradeAvailable(resource, _, rootGetters) {
  // false = does not apply (managed by fleet)
  // null = no upgrade found
  // object = version available to upgrade to

  if (
    resource.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.MANAGED] ||
    resource.spec?.chart?.metadata?.annotations?.[FLEET.BUNDLE_ID]
  ) {
    // Things managed by fleet shouldn't show upgrade available even if there might be.
    return false;
  }

  const chart = matchingChart(resource, false, rootGetters['catalog/chart']);

  if ( !chart ) {
    return null;
  }

  const workerOSs = rootGetters['currentCluster'].workerOSs;

  const showPreRelease = rootGetters['prefs/get'](SHOW_PRE_RELEASE);

  const thisVersion = resource.spec?.chart?.metadata?.version;
  let versions = chart.versions;

  if (!showPreRelease) {
    versions = chart.versions.filter(v => !isPrerelease(v.version));
  }

  versions = compatibleVersionsFor(chart, workerOSs, showPreRelease);

  const newestChart = versions?.[0];
  const newestVersion = newestChart?.version;

  if ( !thisVersion || !newestVersion ) {
    return null;
  }

  if ( compare(thisVersion, newestVersion) < 0 ) {
    return cleanupVersion(newestVersion);
  }

  return null;
}

export function _getUpgradeAvailableSort(resource) {
  const version = resource.upgradeAvailable;

  if ( !version ) {
    return '~'; // Tilde sorts after all numbers and letters
  }

  return sortable(version);
}

export function _getDeployedResources(resource) {
  return filterBy(resource.metadata?.relationships || [], 'rel', 'helmresource');
}

export const calculatedFields = [
  { name: 'nameDisplay', func: _getNameDisplay },
  { name: 'versionDisplay', func: _getVersionDisplay },
  { name: 'chartDisplay', func: _getChartDisplay },
  { name: 'versionSort', func: _getVersionSort },
  {
    name: 'upgradeAvailable', func: _getUpgradeAvailable, caches: ['root', 'prefs', 'catalog']
  },
  { name: 'upgradeAvailableSort', func: _getUpgradeAvailableSort },
  { name: 'deployedResources', func: _getDeployedResources },
];
