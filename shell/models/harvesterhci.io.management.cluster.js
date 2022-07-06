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
      // TODO: RC remove // const versionUrl = `/k8s/clusters/${ clusterId }/apis/management.cattle.io/v3/settings/server-version`; // For example - v2.6.3-harvester1
      const versionUrl = `/k8s/clusters/${ clusterId }/v1/harvester/harvesterhci.io.settings/server-version`; // For example - master-08af3d7c-head
      const res = await this.$dispatch('request', { url: versionUrl });

      this.cachedHarvesterClusterVersion = res.value;
    }

    // Package Name
    const plugin = 'harvester';
    const packageName = `${ plugin }-${ this.cachedHarvesterClusterVersion }`;

    // Harvester's Dashboard URL
    const namespace = 'harvester-system'; // TODO: RC Q Harv - Will this always be the case?
    const serviceName = 'harvester'; // TODO: RC Q Harv - Will this always be the case?

    // TODO: RC NOTE this only works for embedded... to ui-dashboard-index
    // harvester settings - ui-index, ui-source (`bundled` `auto`, `external`)
    // dashboard settings - ui-dashboard-index, ui-offline-preferred ('false', 'dynamic', 'true')
    const dashboardUrl = `/k8s/clusters/${ clusterId }/api/v1/namespaces/${ namespace }/${ SERVICE }s/https:${ serviceName }:8443/proxy/dashboard`;

    // Package URL
    const fileName = `${ packageName }.umd.min.js`;
    const pkgUrl = `${ dashboardUrl }/${ packageName }/${ fileName }`;

    return {
      pkgUrl,
      packageName
    };
  }

  async loadClusterPlugin() {
    const { pkgUrl, packageName } = await this._pkgDetails();

    console.warn('Harvester package details: ', packageName, pkgUrl);

    // TODO: RC
    // console.warn('Harvester package details: ', res.packageName, res.pkgUrl);
    // const pkgUrl = 'http://127.0.0.1:4500/harvester-0.3.0/harvester-0.4.0.umd.min.js';
    // const packageName = 'harvester-0.4.0';

    // TODO: RC NOTE Dashboard upgrade brings in these changes. What happens to existing harvester clusters that won't have pkg, will they be upgraded at same time?
    // TODO: RC NOTE How to include the built harvester in the dashboard build

    // Avoid loading the plugin if it's already loaded
    const loadedPkgs = Object.keys(this.$rootState.$plugin.getPlugins());

    if (!loadedPkgs.includes(packageName)) {
      console.info('Attempting to load harvester plugin', packageName, pkgUrl);

      return await this.$rootState.$plugin.loadAsync(packageName, pkgUrl);
    }
  }

  async standaloneUrl() {
    // TODO: RC - How to get url? Always have ingress? This isn't really going to work...
    const clusterId = this.mgmt.id;
    const ingressUrl = `/k8s/clusters/${ clusterId }/v1/networking.k8s.io.ingresses/cattle-system/rancher`;
    const res = await this.$dispatch('request', { url: ingressUrl });
    const link = res?.spec?.rules?.[0].host;

    if (!link) {
      throw new Error('Unable to find host within ingress rule');
    }

    return `https://${ link }`;
  }

  goToCluster() {
    this.loadClusterPlugin()
      .then(() => {
        this.currentRouter().push({
          name:   `${ VIRTUAL }-c-cluster-resource`,
          params: {
            cluster:  this.status.clusterName,
            product:  VIRTUAL,
            resource: 'harvesterhci.io.dashboard' // Go directly to dashboard to avoid blip of components on screen
          }
        });
      })
      .catch((err) => {
        const message = typeof error === 'object' ? JSON.stringify(err) : err;

        console.error('Failed to loading harvester package: ', message);

        this.standaloneUrl()
          .then((url) => {
            window.open(url, '_blank');
          }).catch((err) => {
            const urlMessage = typeof error === 'object' ? JSON.stringify(err) : err;

            console.error('Failed to determine standalone harvester url: ', urlMessage);

            this.$dispatch('growl/error', {
              title:   this.t('harvesterManager.plugins.loadError'),
              message,
              timeout: 5000
            }, { root: true });
          });
      });
  }
}
