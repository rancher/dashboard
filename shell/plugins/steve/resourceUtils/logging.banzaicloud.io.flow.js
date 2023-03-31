import uniq from 'lodash/uniq';
import { LOGGING } from '@shell/config/types';

export function _getAllOutputs(_, getters) {
  return getters.all(LOGGING.OUTPUT) || [];
}

export function _getAllClusterOutputs(_, getters) {
  return getters.all(LOGGING.CLUSTER_OUTPUT) || [];
}

export function _getOutputs(resource) {
  const localOutputRefs = resource.spec?.localOutputRefs || [];

  return resource.allOutputs.filter(output => localOutputRefs.includes(output.name));
}

export function _getOutputsSortable(resource) {
  const displays = resource.outputs.map(output => output.nameDisplay);

  displays.sort();

  return displays.join('');
}

export function _getClusterOutputs(resource) {
  const globalOutputRefs = resource.spec?.globalOutputRefs || [];

  if (resource.allClusterOutputs) {
    return resource.allClusterOutputs.filter(output => globalOutputRefs.includes(output.name));
  } else {
    // Handle the case where the user doesn't have permission
    // to see ClusterOutputs
    return [];
  }
}

export function _getClusterOutputsSortable(resource) {
  const displays = resource.clusterOutputs.map(output => output.nameDisplay);

  displays.sort();

  return displays.join('');
}

export function _getProvidersDisplay(resource) {
  const combinedOutputs = [...resource.outputs, ...resource.clusterOutputs];
  const duplicatedProviders = combinedOutputs
    .flatMap(output => output.providersDisplay);

  return uniq(duplicatedProviders) || [];
}

export const calculatedFields = [
  { name: 'allOutputs', func: _getAllOutputs },
  { name: 'allClusterOutputs', func: _getAllClusterOutputs },
  { name: 'outputs', func: _getOutputs },
  { name: 'outputsSortable', func: _getOutputsSortable },
  { name: 'clusterOutputs', func: _getClusterOutputs },
  { name: 'clusterOutputsSortable', func: _getClusterOutputsSortable },
  { name: 'providersDisplay', func: _getProvidersDisplay }
];
