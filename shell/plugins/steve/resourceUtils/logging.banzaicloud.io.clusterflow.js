import { LOGGING } from '@shell/config/types';

export function _getAllOutputs(_, getters) {
  return getters.all(LOGGING.CLUSTER_OUTPUT) || [];
}

export function _getOutputs(resource) {
  if (!resource.allOutputs) {
    // Handle the case where the user doesn't have permission
    // to see Outputs
    return [];
  }
  const outputRefs = resource?.spec?.globalOutputRefs || resource?.spec?.outputRefs || [];

  return resource.allOutputs.filter(output => outputRefs.includes(output.name));
}

export const calculatedFields = [
  { name: 'allOutputs', func: _getAllOutputs },
  { name: 'outputs', func: _getOutputs }
];
