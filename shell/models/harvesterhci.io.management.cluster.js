import Vue from 'vue';
import ProvCluster from '@shell/models/provisioning.cattle.io.cluster';
import { DEFAULT_WORKSPACE, HCI, MANAGEMENT } from '@shell/config/types';
import { HARVESTER_NAME, HARVESTER_NAME as VIRTUAL } from '@shell/config/product/harvester-manager';
import { SETTING } from '@shell/config/settings';

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

  _uiInfo = undefined;

  /**
   * Fetch and cache the response for /ui-info
   *
   * Storing this in a cache means any changes to `ui-info` require a dashboard refresh... but it cuts out a http request every time we
   * go to a cluster
   *
   * @param {string} clusterId
   */
  async _getUiInfo(clusterId) {
    if (!this._uiInfo) {
      try {
        const infoUrl = `/k8s/clusters/${ clusterId }/v1/harvester/ui-info`;

        this._uiInfo = await this.$dispatch('request', { url: infoUrl });
      } catch (e) {
        console.info(`Failed to fetch harvester ui-info from ${ this.nameDisplay }, this may be an older cluster that cannot provide one`); // eslint-disable-line no-console
      }
    }

    return this._uiInfo;
  }

  /**
   * Determine the harvester plugin's package name and url for legacy clusters that don't provide the package (i.e. it's coming from
   * outside the cluster)
   */
  _legacyClusterPkgDetails() {
    let uiOfflinePreferred = this.$rootGetters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_OFFLINE_PREFERRED)?.value;
    // options: ['dynamic', 'true', 'false']

    if (uiOfflinePreferred === 'dynamic') {
      // We shouldn't need to worry about the version of the dashboard when embedded in harvester (aka in isSingleProduct)
      const version = this.$rootGetters['management/byId'](MANAGEMENT.SETTING, 'server-version')?.value;

      if (version.endsWith('-head')) {
        uiOfflinePreferred = 'false';
      } else {
        uiOfflinePreferred = 'true';
      }
    }

    // This is the version that's embedded in the dashboard
    const pkgName = `${ HARVESTER_NAME }-1.0.3`;

    if (uiOfflinePreferred === 'true') {
      // Embedded (aka give me the embedded plugin that was in the last rancher release)
      const embeddedPath = `${ pkgName }/${ pkgName }.umd.min.js`;

      return {
        pkgUrl: process.env.dev ? `${ process.env.api }/dashboard/${ embeddedPath }` : embeddedPath,
        pkgName
      };
    }

    if (uiOfflinePreferred === 'false') {
      // Remote (aka give me the latest version of the embedded plugin that might not have been released yet)
      const uiDashboardHarvesterRemotePlugin = this.$rootGetters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_DASHBOARD_HARVESTER_LEGACY_PLUGIN)?.value;
      const parts = uiDashboardHarvesterRemotePlugin?.replace('.umd.min.js', '').split('/');
      const pkgNameFromUrl = parts?.length > 1 ? parts[parts.length - 1] : null;

      if (!pkgNameFromUrl) {
        throw new Error(`Unable to determine harvester plugin name from '${ uiDashboardHarvesterRemotePlugin }'`);
      }

      return {
        pkgUrl:  uiDashboardHarvesterRemotePlugin,
        pkgName: pkgNameFromUrl
      };
    }

    throw new Error(`Unsupported value for ${ SETTING.UI_OFFLINE_PREFERRED }: 'uiOfflinePreferred'`);
  }

  /**
   * Determine the harvester plugin's package name and url for clusters that provide the plugin
   */
  _supportedClusterPkgDetails(uiInfo, clusterId) {
    let pkgName = `${ HARVESTER_NAME }-${ uiInfo['ui-plugin-bundled-version'] }`;
    const fileName = `${ pkgName }.umd.min.js`;
    let pkgUrl;

    if (uiInfo['ui-source'] === 'bundled' ) { // offline bundled
      pkgUrl = `/k8s/clusters/${ clusterId }/v1/harvester/plugin-assets/${ fileName }`;
    } else if (uiInfo['ui-source'] === 'external') {
      if (uiInfo['ui-plugin-index']) {
        pkgUrl = uiInfo['ui-plugin-index'];

        // When using an external address, the pkgName should also be get from the url
        const names = pkgUrl.split('/');
        const jsName = names[names.length - 1];

        pkgName = jsName?.split('.umd.min.js')[0];
      } else {
        throw new Error('Harvester cluster requested the plugin at `ui-plugin-index` is used, however did not provide a value for it');
      }
    }

    return {
      pkgUrl,
      pkgName
    };
  }

  _overridePkgDetails() {
    // Support loading the pkg from a locally, or other, address
    // This helps testing of the harvester plugin when packaged up, instead of directly imported
    const harvesterPkgUrl = process.env.harvesterPkgUrl;

    if (!harvesterPkgUrl) {
      return;
    }
    const parts = harvesterPkgUrl.replace('.umd.min.js', '').split('/');
    const pkgNameFromUrl = parts.length > 1 ? parts[parts.length - 1] : null;

    if (pkgNameFromUrl) {
      return {
        pkgUrl:  harvesterPkgUrl,
        pkgName: pkgNameFromUrl
      };
    }
  }

  async _pkgDetails() {
    const overridePkgDetails = this._overridePkgDetails();

    if (overridePkgDetails) {
      return overridePkgDetails;
    }

    const clusterId = this.mgmt.id;
    const uiInfo = await this._getUiInfo(clusterId);

    return uiInfo ? this._supportedClusterPkgDetails(uiInfo, clusterId) : this._legacyClusterPkgDetails();
  }

  async loadClusterPlugin() {
    // Skip loading if it's built in
    const plugins = this.$rootState.$plugin.getPlugins();
    const loadedPkgs = Object.keys(plugins);

    if (loadedPkgs.find(pkg => pkg === HARVESTER_NAME)) {
      console.info('Harvester plugin built is built in, skipping load from external sources'); // eslint-disable-line no-console

      return;
    }

    // Determine the plugin name and the url it can be fetched from
    const { pkgUrl, pkgName } = await this._pkgDetails();

    console.info('Harvester plugin details: ', pkgName, pkgUrl); // eslint-disable-line no-console

    // Skip loading if we've previously loaded the correct one
    if (!!plugins[pkgName]) {
      console.info('Harvester plugin already loaded, no need to load', pkgName); // eslint-disable-line no-console

      return;
    }

    console.info('Attempting to load Harvester plugin', pkgName); // eslint-disable-line no-console

    const res = await this.$rootState.$plugin.loadAsync(pkgName, pkgUrl);

    console.info('Loaded Harvester plugin', pkgName); // eslint-disable-line no-console

    return res;
  }

  goToCluster() {
    this.loadClusterPlugin()
      .then(() => {
        this.currentRouter().push({
          name:   `${ VIRTUAL }-c-cluster-resource`,
          params: {
            cluster:  this.status.clusterName,
            product:  VIRTUAL,
            resource: HCI.DASHBOARD // Go directly to dashboard to avoid blip of components on screen
          }
        });
      })
      .catch((err) => {
        const message = typeof error === 'object' ? JSON.stringify(err) : err;

        console.error('Failed to load harvester package: ', message); // eslint-disable-line no-console

        this.$dispatch('growl/error', {
          title:   this.t('harvesterManager.plugins.loadError'),
          message,
          timeout: 5000
        }, { root: true });
      });
  }
}
