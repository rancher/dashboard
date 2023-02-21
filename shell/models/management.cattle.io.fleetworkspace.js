import { COUNT, FLEET, NORMAN } from '@shell/config/types';
import { filterBy } from '@shell/utils/array';
import HybridModel from '@shell/plugins/steve/hybrid-class';

export default class Workspace extends HybridModel {
  get isLocal() {
    return this.metadata.name === 'fleet-local';
  }

  get counts() {
    const summary = this.$rootGetters[`management/all`](COUNT)[0].counts || {};
    const name = this.metadata.name;

    const out = {
      clusterGroups: summary[FLEET.CLUSTER_GROUP]?.namespaces?.[name]?.count || 0,
      clusters:      summary[FLEET.CLUSTER]?.namespaces?.[name]?.count || 0,
      gitRepos:      summary[FLEET.GIT_REPO]?.namespaces?.[name]?.count || 0
    };

    return out;
  }

  get clusters() {
    const all = this.$getters['all'](FLEET.CLUSTER);
    const forWorkspace = filterBy(all, 'metadata.namespace', this.metadata.name);

    return forWorkspace;
  }

  get clusterGroups() {
    const all = this.$getters['all'](FLEET.CLUSTER_GROUP);
    const forWorkspace = filterBy(all, 'metadata.namespace', this.metadata.name);

    return forWorkspace;
  }

  get repos() {
    const all = this.$getters['all'](FLEET.GIT_REPO);
    const forWorkspace = filterBy(all, 'namespace', this.id);

    return forWorkspace;
  }

  get basicNorman() {
    if (this.id) {
      return this.$dispatch(`rancher/find`, { id: this.id, type: NORMAN.FLEET_WORKSPACES }, { root: true });
    }

    return this.$dispatch(`rancher/create`, { type: NORMAN.FLEET_WORKSPACES, name: this.metadata.name }, { root: true });
  }

  get norman() {
    return (async() => {
      const norman = await this.basicNorman;

      norman.annotations = this.metadata.annotations;
      norman.labels = this.metadata.labels;

      return norman;
    })();
  }

  async save() {
    const norman = await this.norman;

    await norman.save();
  }

  waitForWorkspaceSchema(timeout = 20000, schemaCallback) {
    return this.waitForTestFn(() => {
      const schema = this.$rootGetters['management/schemaFor'](FLEET.WORKSPACE);

      if (!schemaCallback) {
        return schema;
      }

      return schemaCallback(schema);
    }, this.$rootGetters['i18n/t']('fleet.workspaces.timeout'), timeout);
  }

  async remove() {
    const norman = await this.norman;

    await norman.remove();
  }
}
