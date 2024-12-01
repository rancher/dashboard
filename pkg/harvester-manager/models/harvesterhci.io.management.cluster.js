import ProvCluster from '@shell/models/provisioning.cattle.io.cluster';
import { DEFAULT_WORKSPACE, HCI, MANAGEMENT } from '@shell/config/types';
import { HARVESTER_NAME, HARVESTER_NAME as VIRTUAL } from '@shell/config/features';
import { SETTING } from '@shell/config/settings';
import { colorForState, stateDisplay, STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

export default class HciCluster extends ProvCluster {
  get isSupportedHarvester() {
    return this._isSupportedHarvester === undefined ? true : this._isSupportedHarvester;
  }

  get harvesterVersion() {
    return this._harvesterVersion || this.$rootGetters['i18n/t']('generic.provisioning');
  }

  get stateObj() {
    if (!this.isSupportedHarvester) {
      return { error: true, message: this.t('harvesterManager.cluster.supportMessage') };
    }

    return this._stateObj;
  }

  applyDefaults() {
    if ( !this.spec ) {
      this['spec'] = { agentEnvVars: [] };
      this['metadata'] = { namespace: DEFAULT_WORKSPACE };
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

  get stateColor() {
    if (!this.isSupportedHarvester) {
      return colorForState(STATES_ENUM.DENIED);
    }

    return colorForState(this.state);
  }

  get stateDisplay() {
    if (!this.isSupportedHarvester) {
      return stateDisplay(STATES_ENUM.DENIED);
    }

    return stateDisplay(this.state);
  }

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
      const version = this.$rootGetters['management/byId'](MANAGEMENT.SETTING, SETTING.VERSION_RANCHER)?.value;

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

  async goToCluster() {
    this.currentRouter().push({
      name:   `${ VIRTUAL }-c-cluster-resource`,
      params: {
        cluster:  this.status.clusterName,
        product:  VIRTUAL,
        resource: HCI.DASHBOARD // Go directly to dashboard to avoid blip of components on screen
      }
    });
  }

  async setSupportedHarvesterVersion() {
    if (this._isSupportedHarvester !== undefined) {
      return;
    }

    const url = `/k8s/clusters/${ this.status.clusterName }/v1`;

    try {
      const setting = await this.$dispatch('request', { url: `${ url }/${ HCI.SETTING }s/server-version` });

      this._harvesterVersion = setting?.value;
      this._isSupportedHarvester = this.$rootGetters['harvester-common/getFeatureEnabled']('supportHarvesterClusterVersion', setting?.value);
    } catch (error) {
      console.error('unable to get harvester version from settings/server-version', error); // eslint-disable-line no-console
    }
  }
}
