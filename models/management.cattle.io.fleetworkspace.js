import { COUNT, FLEET, NORMAN } from '@/config/types';
import { filterBy } from '@/utils/array';

export default {
  isLocal() {
    return this.metadata.name === 'fleet-local';
  },

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

  clusters() {
    const all = this.$getters['all'](FLEET.CLUSTER);
    const forWorkspace = filterBy(all, 'metadata.namespace', this.metadata.name);

    return forWorkspace;
  },

  clusterGroups() {
    const all = this.$getters['all'](FLEET.CLUSTER_GROUP);
    const forWorkspace = filterBy(all, 'metadata.namespace', this.metadata.name);

    return forWorkspace;
  },

  basicNorman() {
    if (this.id) {
      return this.$dispatch(`rancher/find`, { id: this.id, type: NORMAN.FLEET_WORKSPACES }, { root: true });
    }

    return this.$dispatch(`rancher/create`, { type: NORMAN.FLEET_WORKSPACES, name: this.metadata.name }, { root: true });
  },

  async norman() {
    const norman = await this.basicNorman;

    norman.annotations = this.metadata.annotations;
    norman.labels = this.metadata.labels;

    return norman;
  },

  save() {
    return async() => {
      const norman = await this.norman;

      return norman.save();
    };
  },

  remove() {
    return async() => {
      const norman = await this.norman;

      await norman.remove();
    };
  }
};
