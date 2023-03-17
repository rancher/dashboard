import { WORKLOAD_TYPES, POD } from '@shell/config/types';
import { matches } from '@shell/utils/selector';

export function _getDesired(resource) {
  return resource.spec?.replicas || 0;
}

export function _getReady(resource) {
  const readyReplicas = Math.max(0, (resource.status?.replicas || 0) - (resource.status?.unavailableReplicas || 0));

  if (resource.type === WORKLOAD_TYPES.DAEMON_SET) {
    return readyReplicas;
  }

  return `${ readyReplicas }/${ resource.desired }`;
}

export function _getPods(resource, { podsByNamespace }) {
  const relationships = resource.metadata?.relationships || [];
  const podRelationship = relationships.filter(relationship => relationship.toType === POD)[0];

  if (podRelationship) {
    const pods = podsByNamespace(resource.metadata.namespace);

    return pods.filter((obj) => {
      const matchingPods = matches(obj, podRelationship.selector);

      return matchingPods;
    });
  } else {
    return [];
  }
}

export function _getPodIds(resource) {
  return resource.pods.map(pod => pod.id);
}

export function _getRestartCount(resource) {
  const pods = resource.pods;

  let sum = 0;

  pods.forEach((pod) => {
    if (pod.status.containerStatuses) {
      sum += pod.status?.containerStatuses[0].restartCount || 0;
    }
  });

  return sum;
}

export const calculatedFields = [
  { name: 'desired', func: _getDesired },
  {
    name: 'ready', func: _getReady, dependsOn: ['desired']
  },
  {
    name: 'pods', func: _getPods, cache: [POD]
  },
  {
    name: 'restartCount', func: _getRestartCount, dependsOn: ['pods']
  },
];
