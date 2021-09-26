import { VIRTUAL_HARVESTER_PROVIDER } from '@/config/types';
import { HCI } from '@/config/labels-annotations';

// Filter out any clusters that are not Kubernetes Clusters
// Currently this removes Harvester clusters
export function filterOnlyKubernetesClusters(mgmtClusters) {
  return mgmtClusters.filter((c) => {
    return !c.isHarvester;
  });
}

export function isHarvesterCluster(mgmtCluster) {
  return mgmtCluster?.metadata?.labels?.[HCI.HARVESTER_CLUSTER] === 'true' || mgmtCluster?.status?.provider === VIRTUAL_HARVESTER_PROVIDER;
}
