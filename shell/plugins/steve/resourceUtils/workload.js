import { WORKLOAD_TYPES, POD } from '@shell/config/types';
import { matches } from '@shell/utils/selector';
import { get } from '@shell/utils/object';

export function _getDesired(resource) {
  return resource.spec?.replicas || 0;
}

export function _getOwnedByWorkload(resource) {
  const types = Object.values(WORKLOAD_TYPES);

  if (resource.metadata?.ownerReferences) {
    for (const owner of resource.metadata.ownerReferences) {
      const have = (`${ owner.apiVersion.replace(/\/.*/, '') }.${ owner.kind }`).toLowerCase();

      if ( types.includes(have) ) {
        return true;
      }
    }
  }

  return false;
}

export function _getReady(resource) {
  const readyReplicas = Math.max(0, (resource.status?.replicas || 0) - (resource.status?.unavailableReplicas || 0));

  if (resource.type === WORKLOAD_TYPES.DAEMON_SET) {
    return readyReplicas;
  }

  return `${ readyReplicas }/${ resource.desired }`;
}

export function _getJobRelationships(resource) {
  if (resource.type !== WORKLOAD_TYPES.CRON_JOB) {
    return undefined;
  }

  return (get(resource, 'metadata.relationships') || []).filter(relationship => relationship.toType === WORKLOAD_TYPES.JOB);
}

export function _getJobs(resource, getters) {
  if (resource.type !== WORKLOAD_TYPES.CRON_JOB) {
    return undefined;
  }

  return resource.jobRelationships.map((obj) => {
    return getters['byId'](WORKLOAD_TYPES.JOB, obj.toId );
  }).filter(x => !!x);
}

export function _getPods(resource, getters) {
  const relationships = resource.metadata?.relationships || [];
  const podRelationship = relationships.filter(relationship => relationship.toType === POD)[0];

  if (podRelationship) {
    const podsByNamespaceList = getters.podsByNamespace(resource.metadata.namespace);

    const pods = podsByNamespaceList.filter((obj) => {
      const matchingPod = matches(obj, podRelationship.selector);

      return matchingPod;
    });

    return pods;
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

export function _getSubResources(resource) {
  return {
    [POD]:                (resource.pods || []).map(pod => pod.id),
    [WORKLOAD_TYPES.JOB]: (resource.jobs || []).map(job => job.id)
  };
}

export const calculatedFields = [
  { name: 'desired', func: _getDesired },
  { name: 'ownedByWorkload', func: _getOwnedByWorkload },
  {
    name: 'ready', func: _getReady, dependsOn: ['desired']
  },
  { name: 'jobRelationships', func: _getJobRelationships },
  {
    name: 'pods', func: _getPods, caches: [POD]
  },
  {
    name: 'jobs', func: _getJobs, dependsOn: ['jobRelationships'], caches: [WORKLOAD_TYPES.JOB]
  },
  {
    name: 'restartCount', func: _getRestartCount, dependsOn: ['pods']
  },
  {
    name: 'subResources', func: _getSubResources, dependsOn: ['pods', 'jobs']
  }
];
