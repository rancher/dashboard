import semver from 'semver';
import { CAPI } from '@shell/config/labels-annotations';
import { MANAGEMENT, VIRTUAL_HARVESTER_PROVIDER } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

// Filter out any clusters that are not Kubernetes Clusters
// Currently this removes Harvester clusters
export function filterOnlyKubernetesClusters(mgmtClusters) {
  return mgmtClusters.filter((c) => {
    return !c.isHarvester;
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
