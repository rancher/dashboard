import semver from 'semver';
import { camelToTitle } from '@shell/utils/string';
import { CAPI } from '@shell/config/labels-annotations';
import { MANAGEMENT, VIRTUAL_HARVESTER_PROVIDER } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';

/**
 * Combination of paginationFilterHiddenLocalCluster and paginationFilterOnlyKubernetesClusters
 *
 * @param {*} store
 * @returns PaginationParam[]
 */
export function paginationFilterClusters(store, filterMgmtCluster = true) {
  const paginationRequestFilters = [];

  // Commenting out for the moment. This is broken for non-paginated world
  // filterOnlyKubernetesClusters expects a mgmt cluster, however in the home page it's given a prov cluster
  // note - filterHiddenLocalCluster works because it uses model isLocal which is on both cluster types
  // const pFilterOnlyKubernetesClusters = paginationFilterOnlyKubernetesClusters(store);
  // if (pFilterOnlyKubernetesClusters) {
  //   paginationRequestFilters.push(pFilterOnlyKubernetesClusters);
  // }
  const pFilterHiddenLocalCluster = paginationFilterHiddenLocalCluster(store, filterMgmtCluster);

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
 * Checks to see if the current user has access to the local store
 *
 * @export
 * @param {*} store
 * @returns {boolean} true if the user does false otherwise
 */
export async function hasAccessToLocalCluster(store) {
  // If the user has access to local the request will be successful otherwise it will return a 403 which we have to catch.
  try {
    await store.dispatch('management/find', { type: MANAGEMENT.CLUSTER, id: 'local' });

    return true;
  } catch {
    return false;
  }
}

/**
 * The vai backed api's `filter` equivalent of `filterOnlyKubernetesClusters`
 *
 * @export
 * @param {*} store
 * @returns PaginationParam | null
 */
export function paginationFilterOnlyKubernetesClusters(store) {
  const openHarvesterContainerWorkload = store.getters['features/get']('harvester-baremetal-container-workload');

  if (!openHarvesterContainerWorkload) {
    return null;
  }

  return PaginationParamFilter.createMultipleFields([
    new PaginationFilterField({
      field:  `metadata.labels."${ CAPI.PROVIDER }"`,
      equals: false,
      value:  VIRTUAL_HARVESTER_PROVIDER,
      exact:  true
    }),
    new PaginationFilterField({
      field:  `status.provider`,
      equals: false,
      value:  VIRTUAL_HARVESTER_PROVIDER,
      exact:  true
    }),
  ]);
}

/**
 * Filter out any clusters that are not Kubernetes Clusters
 **/
export function filterOnlyKubernetesClusters(mgmtClusters, store) {
  const openHarvesterContainerWorkload = store.getters['features/get']('harvester-baremetal-container-workload');

  return mgmtClusters?.filter((c) => {
    return openHarvesterContainerWorkload ? true : !isHarvesterCluster(c);
  });
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
