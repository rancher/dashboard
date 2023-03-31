import { COUNT, FLEET } from '@shell/config/types';

export function _getCounts(resource, getters, rootGetters) {
  const summary = getters.all(COUNT)[0].counts || {};
  const name = resource.metadata.name;

  const out = {
    clusterGroups: summary[FLEET.CLUSTER_GROUP]?.namespaces?.[name]?.count || 0,
    clusters:      summary[FLEET.CLUSTER]?.namespaces?.[name]?.count || 0,
    gitRepos:      summary[FLEET.GIT_REPO]?.namespaces?.[name]?.count || 0
  };

  return out;
}

export const calculatedFields = [
  { name: 'counts', func: _getCounts }
];
