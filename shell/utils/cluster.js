import semver from 'semver';
import { camelToTitle } from '@shell/utils/string';
import { CAPI } from '@shell/config/labels-annotations';
import { MANAGEMENT, VIRTUAL_HARVESTER_PROVIDER } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';
import { compare, sortable } from '@shell/utils/version';
import { sortBy } from '@shell/utils/sort';
import { HARVESTER_CONTAINER, SCHEDULING_CUSTOMIZATION } from '@shell/store/features';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import isEmptyLodash from 'lodash/isEmpty';
import { set, diff, isEmpty, clone } from '@shell/utils/object';

/**
 * Combination of paginationFilterHiddenLocalCluster and paginationFilterOnlyKubernetesClusters
 *
 * @param {*} store
 * @returns PaginationParam[]
 */
export function paginationFilterClusters(store, filterMgmtCluster = true) {
  const paginationRequestFilters = [];

  const pFilterOnlyKubernetesClusters = paginationFilterOnlyKubernetesClusters(store);
  const pFilterHiddenLocalCluster = paginationFilterHiddenLocalCluster(store, filterMgmtCluster);

  if (pFilterOnlyKubernetesClusters) {
    paginationRequestFilters.push(...pFilterOnlyKubernetesClusters);
  }

  if (pFilterHiddenLocalCluster) {
    paginationRequestFilters.push(pFilterHiddenLocalCluster);
  }

  return paginationRequestFilters;
}

/**
 * The vai backed api's `filter` equivalent of `filterHiddenLocalCluster`
 *
 * @export
 * @param {*} store
 * @returns PaginationParam | null
 */
export function paginationFilterHiddenLocalCluster(store, filterMgmtCluster = true) {
  const hideLocalSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.HIDE_LOCAL_CLUSTER) || {};
  const value = hideLocalSetting.value || hideLocalSetting.default || 'false';
  const hideLocal = value === 'true';

  if (!hideLocal) {
    return null;
  }

  const filter = filterMgmtCluster ? [
    new PaginationFilterField({
      field: `spec.internal`,
      value: false,
    })
  ] : [
    new PaginationFilterField({
      field:  `id`,
      value:  'fleet-local/local',
      exact:  true,
      equals: false,
    })
  ];

  return PaginationParamFilter.createMultipleFields(filter);
}

/**
 * The vai backed api's `filter` equivalent of `filterOnlyKubernetesClusters`
 *
 * @export
 * @param {*} store
 * @returns PaginationParam | null
 */
export function paginationFilterOnlyKubernetesClusters(store) {
  const openHarvesterContainerWorkload = store.getters['features/get'](HARVESTER_CONTAINER);

  if (openHarvesterContainerWorkload) {
    // Show harvester clusters
    return null;
  }

  // Filter out harvester clusters
  return [
    PaginationParamFilter.createSingleField(new PaginationFilterField({
      field:  `metadata.labels[${ CAPI.PROVIDER }]`,
      equals: false,
      value:  VIRTUAL_HARVESTER_PROVIDER,
      exact:  true
    })),
    PaginationParamFilter.createSingleField(new PaginationFilterField({
      field:  `status.provider`,
      equals: false,
      value:  VIRTUAL_HARVESTER_PROVIDER,
      exact:  true
    }))
  ];
}

/**
 * Filter out any clusters that are not Kubernetes Clusters
 **/
export function filterOnlyKubernetesClusters(mgmtClusters, store) {
  const openHarvesterContainerWorkload = store.getters['features/get'](HARVESTER_CONTAINER);

  if (openHarvesterContainerWorkload) {
    // Show harvester clusters
    return mgmtClusters;
  }

  // Filter out harvester clusters
  return mgmtClusters?.filter((c) => !isHarvesterCluster(c));
}

export function isHarvesterCluster(mgmtCluster) {
  // Use the provider if it is set otherwise use the label
  const provider = mgmtCluster?.metadata?.labels?.[CAPI.PROVIDER] || mgmtCluster?.status?.provider;

  return provider === VIRTUAL_HARVESTER_PROVIDER;
}

export function isHarvesterSatisfiesVersion(version = '') {
  if (version.startsWith('v1.21.4+rke2r')) {
    const rkeVersion = version.replace(/.+rke2r/i, '');

    return Number(rkeVersion) >= 4;
  } else {
    return semver.satisfies(semver.coerce(version), '>=v1.21.4+rke2r4');
  }
}

export function filterHiddenLocalCluster(mgmtClusters, store) {
  const hideLocalSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.HIDE_LOCAL_CLUSTER) || {};
  const value = hideLocalSetting.value || hideLocalSetting.default || 'false';
  const hideLocal = value === 'true';

  if (!hideLocal) {
    return mgmtClusters;
  }

  return mgmtClusters.filter((c) => {
    const target = c.mgmt || c;

    return !target.isLocal;
  });
}

const clusterNameSegments = /([A-Za-z]+|\d+)/g;

/**
 * Shortens an input string based on the number of segments it contains.
 * @param {string} input - The input string to be shortened.
 * @returns {string} - The shortened string.
 * @example smallIdentifier('local') => 'lcl'
 * @example smallIdentifier('word-wide-web') => 'www'
 */
export function abbreviateClusterName(input) {
  if (!input) {
    return '';
  }

  if (input.length <= 3) {
    return input;
  }

  const segments = input.match(clusterNameSegments);

  if (!segments) return ''; // In case no valid segments are found

  let result = '';

  switch (segments.length) {
  case 1: {
    const word = segments[0];

    result = `${ word[0] }${ word[Math.floor(word.length / 2)] }${ word[word.length - 1] }`;
    break;
  }
  case 2: {
    const w1 = `${ segments[0][0] }`;
    const w2 = `${ segments[0].length >= 2 ? segments[0][segments[0].length - 1] : segments[1][0] }`;
    const w3 = `${ segments[1][segments[1].length - 1] }`;

    result = w1 + w2 + w3;
    break;
  }
  default:
    result = segments.slice(0, 2).map((segment) => segment[0]).join('') + segments.slice(-1)[0].slice(-1);
  }

  return result;
}

export function labelForAddon(store, name, configuration = true) {
  const addon = camelToTitle(name.replace(/^(rke|rke2|rancher)-/, ''));
  const fallback = `${ configuration ? '' : 'Add-on: ' }${ addon }`;
  const key = `cluster.addonChart."${ name }"${ configuration ? '.configuration' : '.label' }`;

  return store.getters['i18n/withFallback'](key, null, fallback);
}

function getMostRecentPatchVersions(sortedVersions) {
  // Get the most recent patch version for each Kubernetes minor version.
  const versionMap = {};

  sortedVersions.forEach((version) => {
    const majorMinor = `${ semver.major(version.value) }.${ semver.minor(version.value) }`;

    if (!versionMap[majorMinor]) {
      // Because we start with a sorted list of versions, we know the
      // highest patch version is first in the list, so we only keep the
      // first of each minor version in the list.
      versionMap[majorMinor] = version.value;
    }
  });

  return versionMap;
}

export function filterOutDeprecatedPatchVersions(allVersions, currentVersion) {
  // Get the most recent patch version for each Kubernetes minor version.
  const mostRecentPatchVersions = getMostRecentPatchVersions(allVersions);

  const filteredVersions = allVersions.filter((version) => {
    // Always show pre-releases
    if (semver.prerelease(version.value)) {
      return true;
    }

    const majorMinor = `${ semver.major(version.value) }.${ semver.minor(version.value) }`;

    // Always show current version, else show if we haven't shown anything for this major.minor version yet
    if (version.value === currentVersion || mostRecentPatchVersions[majorMinor] === version.value) {
      return true;
    }

    return false;
  });

  return filteredVersions;
}

export function getAllOptionsAfterCurrentVersion(store, versions, currentVersion, defaultVersion, manual = false) {
  const out = (versions || []).filter((obj) => !!obj.serverArgs).map((obj) => {
    let disabled = false;
    let experimental = false;
    let isCurrentVersion = false;
    let label = obj.id;

    if (currentVersion) {
      disabled = compare(obj.id, currentVersion) < 0;
      isCurrentVersion = compare(obj.id, currentVersion) === 0;
    }

    if (defaultVersion) {
      experimental = compare(defaultVersion, obj.id) < 0;
    }

    if (isCurrentVersion) {
      label = `${ label } ${ store.getters['i18n/t']('cluster.kubernetesVersion.current') }`;
      if (manual) {
        label = `${ label } ${ store.getters['i18n/t']('cluster.kubernetesVersion.manual') }`;
      }
    }

    if (experimental) {
      label = `${ label } ${ store.getters['i18n/t']('cluster.kubernetesVersion.experimental') }`;
    }

    return {
      label,
      value:      obj.id,
      sort:       sortable(obj.id),
      serverArgs: obj.serverArgs,
      agentArgs:  obj.agentArgs,
      charts:     obj.charts,
      disabled,
    };
  });

  if (currentVersion && !out.find((obj) => obj.value === currentVersion)) {
    out.push({
      label: `${ currentVersion } ${ store.getters['i18n/t']('cluster.kubernetesVersion.current') }`,
      value: currentVersion,
      sort:  sortable(currentVersion),
    });
  }

  const sorted = sortBy(out, 'sort:desc');

  const mostRecentPatchVersions = getMostRecentPatchVersions(sorted);

  const sortedWithDeprecatedLabel = sorted.map((optionData) => {
    const majorMinor = `${ semver.major(optionData.value) }.${ semver.minor(optionData.value) }`;

    if (mostRecentPatchVersions[majorMinor] === optionData.value) {
      return optionData;
    }

    return {
      ...optionData,
      label: `${ optionData.label } ${ store.getters['i18n/t']('cluster.kubernetesVersion.deprecated') }`
    };
  });

  return sortedWithDeprecatedLabel;
}

export async function initSchedulingCustomization(value, features, store, mode) {
  const schedulingCustomizationFeatureEnabled = features(SCHEDULING_CUSTOMIZATION);
  let clusterAgentDefaultPC = null;
  let clusterAgentDefaultPDB = null;
  let schedulingCustomizationOriginallyEnabled = false;
  const errors = [];

  try {
    clusterAgentDefaultPC = JSON.parse((await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.CLUSTER_AGENT_DEFAULT_PRIORITY_CLASS })).value) || null;
  } catch (e) {
    errors.push(e);
  }
  try {
    clusterAgentDefaultPDB = JSON.parse((await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.CLUSTER_AGENT_DEFAULT_POD_DISTRIBUTION_BUDGET })).value) || null;
  } catch (e) {
    errors.push(e);
  }

  if (schedulingCustomizationFeatureEnabled && mode === _CREATE && isEmptyLodash(value?.clusterAgentDeploymentCustomization?.schedulingCustomization)) {
    set(value, 'clusterAgentDeploymentCustomization.schedulingCustomization', { priorityClass: clusterAgentDefaultPC, podDisruptionBudget: clusterAgentDefaultPDB });
  }

  if (mode === _EDIT && !!value?.clusterAgentDeploymentCustomization?.schedulingCustomization) {
    schedulingCustomizationOriginallyEnabled = true;
  }

  return {
    clusterAgentDefaultPC, clusterAgentDefaultPDB, schedulingCustomizationFeatureEnabled, schedulingCustomizationOriginallyEnabled, errors
  };
}

/**
 * Recursively filters a `diffs` object to only include differences that are relevant to the user.
 * A difference is considered relevant if the user has provided a custom value for that specific field.
 *
 * @param {object} diffs - The object representing the differences between two chart versions' default values.
 * @param {object} userVals - The object containing the user's custom values.
 * @returns {object} A new object containing only the relevant differences.
 */
export function _addonConfigPreserveFilter(diffs, userVals) {
  const filtered = {};

  for (const key of Object.keys(diffs)) {
    const diffVal = diffs[key];
    const userVal = userVals?.[key];

    const isDiffObject = typeof diffVal === 'object' && diffVal !== null && !Array.isArray(diffVal);
    const isUserObject = typeof userVal === 'object' && userVal !== null && !Array.isArray(userVal);

    // If both the diff and user value are objects, we need to recurse into them.
    if (isDiffObject && isUserObject) {
      const nestedFiltered = _addonConfigPreserveFilter(diffVal, userVal);

      if (!isEmpty(nestedFiltered)) {
        filtered[key] = nestedFiltered;
      }
    } else if (userVal !== undefined) {
      // If the user has provided a value for this key, the difference is relevant.
      filtered[key] = diffVal;
    }
  }

  return filtered;
}

/**
 * Processes a single add-on version change. It fetches the old and new chart information,
 * calculates the differences in default values, and filters them based on user's customizations.
 * If there are no significant differences, it preserves the user's custom values for the new version.
 *
 * @param {object} store The Vuex store.
 * @param {object} userChartValues The user's customized chart values.
 * @param {string} chartName The name of the chart to process.
 * @param {object} oldAddon The addon information from the previous Kubernetes version.
 * @param {object} newAddon The addon information from the new Kubernetes version.
 * @returns {object|null} An object containing the diff and a preserve flag, or null on error.
 */
async function _addonConfigPreserveProcess(store, userChartValues, chartName, oldAddon, newAddon) {
  if (chartName.includes('none')) {
    return null;
  }

  try {
    const [oldVersionInfo, newVersionInfo] = await Promise.all([
      store.dispatch('catalog/getVersionInfo', {
        repoType:    'cluster',
        repoName:    oldAddon.repo,
        chartName,
        versionName: oldAddon.version,
      }),
      store.dispatch('catalog/getVersionInfo', {
        repoType:    'cluster',
        repoName:    newAddon.repo,
        chartName,
        versionName: newAddon.version,
      })
    ]);

    const oldDefaults = oldVersionInfo.values;
    const newDefaults = newVersionInfo.values;
    const defaultsDifferences = diff(oldDefaults, newDefaults);

    const userOldValues = userChartValues[`${ chartName }-${ oldAddon.version }`];

    // We only care about differences in values that the user has actually customized.
    // If the user hasn't touched a value, a change in its default should not be considered a breaking change.
    const defaultsAndUserDifferences = userOldValues ? _addonConfigPreserveFilter(defaultsDifferences, userOldValues) : {};

    return {
      diff:     defaultsAndUserDifferences,
      preserve: isEmpty(defaultsAndUserDifferences)
    };
  } catch (e) {
    console.error(`Failed to get chart version info for diff for chart ${ chartName }`, e); // eslint-disable-line no-console

    return null;
  }
}

/**
 * @typedef {object} AddonPreserveContext
 * @property {object} addonConfigDiffs - An object that stores the diffs.
 * @property {string[]} addonNames - An array of addon names to check.
 * @property {object} $store - The Vuex store.
 * @property {object} userChartValues - The user's customized chart values.
 *
 * When the Kubernetes version is changed, this method is called to handle the add-on configurations
 * for all enabled addons. It checks if an addon's version has changed and, if so, determines if the
 * user's custom configurations should be preserved for the new version.
 *
 * The goal is to avoid showing a confirmation dialog for changes in default values that the user has not customized.
 *
 * @param {AddonPreserveContext} context The context object from the component.
 * @param {object} oldCharts The charts object from the K8s release object being changed from.
 * @param {object} newCharts The charts object from the K8s release object being changed to.
 */
export async function addonConfigPreserve(context, oldCharts, newCharts) {
  const {
    addonConfigDiffs,
    addonNames,
    $store,
    userChartValues
  } = context;

  if (!oldCharts || !newCharts) {
    return;
  }

  // Clear the diffs object for the new run
  for (const key in addonConfigDiffs) {
    delete addonConfigDiffs[key];
  }

  // Iterate through the addons that are enabled for the cluster.
  for (const chartName of addonNames) {
    const oldAddon = oldCharts[chartName];
    const newAddon = newCharts[chartName];

    // If the addon didn't exist in the old K8s version, there's nothing to compare.
    if (!oldAddon) {
      continue;
    }

    // Check if the add-on version has changed.
    if (newAddon && newAddon.version !== oldAddon.version) {
      const result = await _addonConfigPreserveProcess($store, userChartValues, chartName, oldAddon, newAddon);

      if (result) {
        addonConfigDiffs[chartName] = result.diff;

        if (result.preserve) {
          const oldKey = `${ chartName }-${ oldAddon.version }`;
          const newKey = `${ chartName }-${ newAddon.version }`;

          // If custom values exist for the old version, and none exist for the new version,
          // copy the values to the new key to preserve them.
          if (userChartValues[oldKey] && !userChartValues[newKey]) {
            userChartValues[newKey] = clone(userChartValues[oldKey]);
          }
        }
      }
    }
  }
}
