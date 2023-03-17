import { CAPI } from '@shell/config/types';
import { SNAPSHOT } from '@shell/config/labels-annotations';
import { findBy } from '@shell/utils/array';

export function _getClusterName(resource) {
  return resource.metadata.labels[SNAPSHOT.CLUSTER_NAME];
}

export function _getCluster(resource, { mgmtAll }) {
  return findBy(mgmtAll(CAPI.RANCHER_CLUSTER), 'metadata.name', resource.clusterName);
}

export function _getName(resource) {
  return resource.metadata.name;
}

export function _getNameDisplay(resource) {
  return resource.snapshotFile?.name || resource.name;
}

export function _getClusterId(resource) {
  return resource.cluster.id;
}

export const calculatedFields = [
  { name: 'clusterName', func: _getClusterName },
  {
    name: 'cluser', func: _getCluster, tempCache: ['management']
  },
  { name: 'name', func: _getName },
  { name: 'nameDisplay', func: _getNameDisplay },
  { name: 'clusterId', func: _getClusterId }
];
