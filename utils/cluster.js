import { CAPI } from '@/config/labels-annotations';
import { VIRTUAL_HARVESTER_PROVIDER } from '@/config/types';

// Filter out any clusters that are not Kubernetes Clusters
// Currently this removes Harvester clusters
export function filterOnlyKubernetesClusters(mgmtClusters) {
  return mgmtClusters.filter((c) => {
    return !c.isHarvester;
  });
}

export function isHarvesterCluster(mgmtCluster) {
  // Use the provider if it is set otherwise use the label
  const provider = mgmtCluster?.status?.provider || mgmtCluster?.metadata?.labels?.[CAPI.PROVIDER];

  return provider === VIRTUAL_HARVESTER_PROVIDER;
}
