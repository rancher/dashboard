import Vue from 'vue';
import ProvCluster from '@shell/models/provisioning.cattle.io.cluster';
import { DEFAULT_WORKSPACE } from '@shell/config/types';
import { HARVESTER_NAME as VIRTUAL } from '@shell/config/product/harvester-manager';

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

  goToCluster() {
    // TODO: RC We need to
    // - determine the dashboard url via kube services
    // - add on to path the harvester pkg
    // - we also need to workout the version of pkg to use, which will be used in both pkg url and name
    // const pkgUrl = 'http://127.0.0.1:4501/harvester-0.1.0/harvester-0.1.0.umd.min.js';
    // const packageName = 'harvester-0.1.0';

    // TODO: RC remove `loadPlugin` when we're happy plugins work fine
    // const loadPlugin = this.$rootState.$plugin.loadAsync(packageName, pkgUrl);

    const loadPlugin = Promise.resolve();

    loadPlugin
      .then(() => {
        this.currentRouter().push({
          name:   `${ VIRTUAL }-c-cluster`,
          params: {
            cluster: this.status.clusterName,
            product: VIRTUAL
          }
        });
      })
      .catch((err) => {
        const message = typeof error === 'object' ? JSON.stringify(err) : err;

        this.$dispatch('growl/error', {
          title:   'Error loading harvester plugin', // TODO: RC l10n
          message,
          timeout: 5000
        }, { root: true });
      });
  }
}
