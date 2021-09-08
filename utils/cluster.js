// Filter out any clusters that are not Kubernetes Clusters
// Currently this removes Harvester clusters
export function filterOnlyKubernetesClusters(clusters) {
  return clusters.filter((c) => {
    return !c.isHarvester;
  });
}
