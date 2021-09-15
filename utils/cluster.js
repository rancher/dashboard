const HARVESTER_LABEL = 'cluster.harvesterhci.io';
const VIRTUAL_HARVESTER_PROVIDER = 'harvester';

// Filter out any clusters that are not Kubernetes Clusters
// Currently this removes Harvester clusters
export function filterOnlyKubernetesClusters(clusters) {
  return clusters.filter((c) => {
    return !c.isHarvester;
  });
}

export function isHarvesterCluster(cluster) {
  return cluster.metadata?.labels?.[HARVESTER_LABEL] === 'true' || cluster.provider === VIRTUAL_HARVESTER_PROVIDER;
}
