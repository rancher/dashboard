import Vue from 'vue';
import ProvCluster from '@shell/models/provisioning.cattle.io.cluster';
import { DEFAULT_WORKSPACE, SERVICE } from '@shell/config/types';
import { HARVESTER_NAME, HARVESTER_NAME as VIRTUAL } from '@shell/config/product/harvester-manager';

export default class HciCluster extends ProvCluster {
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

    // Fetch the version of the pkg to fetch
    if (!this.cachedHarvesterClusterVersion) {
      // Note - The version MUST match the version in the pkg's package.json (and filename)
      const versionUrl = `/k8s/clusters/${ clusterId }/v1/harvester/harvesterhci.io.settings/server-version`;
      const res = await this.$dispatch('request', { url: versionUrl });

      this.cachedHarvesterClusterVersion = res.value;
    }

    // Work out the package Name
    const packageName = `${ HARVESTER_NAME }-${ this.cachedHarvesterClusterVersion }`;

    // Work out the dashboard url (which contains the harvester pkg)
    const namespace = 'harvester-system';
    const serviceName = 'harvester';
    // Note - We can always fetch this from the embedded version.
    // Standalone Context - The harv pkg will be built in, so this code is never hit
    // Rancher Context - We will always go out to the harvester package bundled with the cluster
    // So we can ignore the ui-index and ui-source (`bundled` `auto`, `external`) settings
    // TODO: RC cluster members user do not have access to the harvester-system namespace. Seeking input from harv team
    const dashboardUrl = `/k8s/clusters/${ clusterId }/api/v1/namespaces/${ namespace }/${ SERVICE }s/https:${ serviceName }:8443/proxy/dashboard`;

    // Use all of above to create the filename and full url of hte package
    const fileName = `${ packageName }.umd.min.js`;
    const pkgUrl = `${ dashboardUrl }/${ packageName }/${ fileName }doesnotexist`;

    return {
      pkgUrl,
      packageName
    };
  }

  async loadClusterPlugin() {
    const { pkgUrl, packageName } = await this._pkgDetails();

    console.warn('Harvester package details: ', packageName, pkgUrl);

    // TODO: RC Remove
    // const packageName = 'harvester-0.6.0';
    // const pkgUrl = `http://127.0.0.1:4500/${ packageName }/${ packageName }.umd.min.js`;

    // Avoid loading the plugin if it's already loaded
    const loadedPkgs = Object.keys(this.$rootState.$plugin.getPlugins());

    // Skip loading if it's built in or we've previously grabbed it
    if (loadedPkgs.find(pkg => pkg === HARVESTER_NAME) || !!this.$rootState.$plugin.getPlugins()[packageName]) {
      return;
    }

    console.info('Attempting to load harvester plugin', packageName, pkgUrl); // eslint-disable-line no-console

    return await this.$rootState.$plugin.loadAsync(packageName, pkgUrl);
  }

  async standaloneUrl() {
    // TODO: RC This will not always work, ingress isn't to be expected
    // Should use the VIP_IP instead, not sure if this is available. Similar issue to finding the dashboard url above
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

        console.error('Failed to load harvester package: ', message); // eslint-disable-line no-console

        // We cannot load a plugin for this harvester instance, fall back on opening their standalone UI in a different tab
        this.standaloneUrl()
          .then((url) => {
            window.open(url, '_blank');
          }).catch((err) => {
            const urlMessage = typeof error === 'object' ? JSON.stringify(err) : err;

            console.error('Failed to determine standalone harvester url: ', urlMessage); // eslint-disable-line no-console

            this.$dispatch('growl/error', {
              title:   this.t('harvesterManager.plugins.loadError'),
              message,
              timeout: 5000
            }, { root: true });
          });
      });
  }
}
