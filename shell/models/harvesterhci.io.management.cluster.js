import Vue from 'vue';
import ProvCluster from '@shell/models/provisioning.cattle.io.cluster';
import { DEFAULT_WORKSPACE, SERVICE } from '@shell/config/types';
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

  cachedHarvesterClusterVersion = '';

  async _pkgDetails() {
    const clusterId = this.mgmt.id;

    // Version
    if (!this.cachedHarvesterClusterVersion) {
      // TODO: RC NOTE - This version needs to match the harvester package.json version
      // const versionUrl = `/k8s/clusters/${ clusterId }/apis/management.cattle.io/v3/settings/server-version`; // v2.6.3-harvester1
      const versionUrl = `k8s/clusters/${ clusterId }/v1/harvester/harvesterhci.io.settings/server-version`; // master-08af3d7c-head
      const res = await this.$dispatch('request', { url: versionUrl });

      this.cachedHarvesterClusterVersion = res.value;
    }

    // Package Name
    const plugin = 'harvester';
    const packageName = `${ plugin }-${ this.cachedHarvesterClusterVersion }`;

    // Dashboard URL
    const namespace = 'cattle-system';
    const serviceName = 'rancher';
    // TODO: RC NOTE this only works for embedded... to ui-dashboard-index
    // harvester settings - ui-index, ui-source (`bundled` `auto`, `external`)
    // dashboard settings - ui-dashboard-index, ui-offline-preferred ('false', 'dynamic', 'true')
    const dashboardUrl = `/k8s/clusters/${ clusterId }/api/v1/namespaces/${ namespace }/${ SERVICE }s/http:${ serviceName }:80/proxy/dashboard`;

    // Package URL
    const fileName = `${ packageName }.umd.min.js`;
    const pkgUrl = `${ dashboardUrl }/${ fileName }`;

    return {
      pkgUrl,
      packageName
    };
  }

  async loadClusterPlugin() {
    const res = await this._pkgDetails();

    // TODO: RC
    console.warn('Harvester package details: ', res.packageName, res.pkgUrl);
    const pkgUrl = 'http://127.0.0.1:4500/harvester-0.3.0/harvester-0.3.0.umd.min.js';
    const packageName = 'harvester-0.3.0';

    // TODO: RC NOTE Dashboard upgrade brings in these changes. What happens to existing harvester clusters that won't have pkg, will they be upgraded at same time?
    // TODO: RC NOTE How to include the built harvester in the dashboard build

    // Avoid loading the plugin if it's already loaded
    const loadedPkgs = Object.keys(this.$rootState.$plugin.getPlugins());

    if (!loadedPkgs.includes(packageName)) {
      return await this.$rootState.$plugin.loadAsync(packageName, pkgUrl);
    }
  }

  goToCluster() {
    this.loadClusterPlugin()
      .then(() => {
        this.currentRouter().push({
          name:   `${ VIRTUAL }-c-cluster-resource`,
          params: {
            cluster:  this.status.clusterName,
            product:  VIRTUAL,
            resource: 'harvesterhci.io.dashboard' // Avoid blips of components on screen
          }
        });
      })
      .catch((err) => {
        const message = typeof error === 'object' ? JSON.stringify(err) : err;

        this.$dispatch('growl/error', {
          title:   this.t('harvesterManager.plugins.loadError'),
          message,
          timeout: 5000
        }, { root: true });
      });
  }
}
