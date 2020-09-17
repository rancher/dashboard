import { COUNT, FLEET } from '@/config/types';

export default {
  counts() {
    const summary = this.$rootGetters[`management/all`](COUNT)[0].counts || {};
    const name = this.metadata.name;

    const out = {
      clusterGroups: summary[FLEET.CLUSTER_GROUP]?.namespaces?.[name]?.count || 0,
      clusters:      summary[FLEET.CLUSTER]?.namespaces?.[name]?.count || 0,
      gitRepos:      summary[FLEET.GIT_REPO]?.namespaces?.[name]?.count || 0
    };

    return out;
  },
};
