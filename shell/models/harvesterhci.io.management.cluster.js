import Vue from 'vue';
import ProvCluster from '@shell/models/provisioning.cattle.io.cluster';
import { DEFAULT_WORKSPACE } from '@shell/config/types';

export default class HciCluster extends ProvCluster {
  get availableActions() {
    return this._availableActions;
  }

  get stateObj() {
    return this._stateObj;
  }

  applyDefaults() {
    if ( !this.spec ) {
      Vue.set(this, 'spec', { agentEnvVars: [] });
      Vue.set(this, 'metadata', { namespace: DEFAULT_WORKSPACE });
    }
  }

  get isReady() {
    // If the Connected condition exists, use that (2.6+)
    if ( this.hasCondition('Connected') ) {
      return this.isCondition('Connected');
    }

    // Otherwise use Ready (older)
    return this.isCondition('Ready');
  }

  get canEdit() {
    return false;
  }

  loadClusterPlugin() {
    // TODO: RC This is blocked until we work out how the harvester cluster serves up the plugin script
    // We will probably at least need to
    // - determine the dashboard url via cluster's dashboard kube service
    // - add on the path to the script
    // - we also need to workout the version of pkg to use, which will be used in both pkg url and name
    const pkgUrl = 'http://127.0.0.1:4500/harvester-0.3.0/harvester-0.3.0.umd.min.js';
    const packageName = 'harvester-0.3.0';

    return this.$rootState.$plugin.loadAsync(packageName, pkgUrl);
  }
}
