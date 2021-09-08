const HARVESTER_LABEL = 'cluster.harvesterhci.io';

// Filter out any clusters that are not Kubernetes Clusters
// Currently this removed Harvester clusters
export function filterOnlyKubernetesClusters(clusters) {
  return clusters.filter((c) => {
    const labels = c.metadata?.labels || {};
    const isHarvester = labels[HARVESTER_LABEL] === 'true';

    return !isHarvester;
  });
}
