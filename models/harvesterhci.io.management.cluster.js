import Vue from 'vue';
import ProvCluster from '@/models/provisioning.cattle.io.cluster';
import { DEFAULT_WORKSPACE } from '@/config/types';
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
}
