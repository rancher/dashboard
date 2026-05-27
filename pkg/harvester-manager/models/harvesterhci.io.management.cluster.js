import ProvCluster from '@shell/models/provisioning.cattle.io.cluster';
import { DEFAULT_WORKSPACE, HCI, MANAGEMENT, CAPI } from '@shell/config/types';
import { HARVESTER_NAME as VIRTUAL } from '@shell/config/features';
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
    const conditions = this.mgmt?.status?.conditions || [];
    const connected = conditions.find((c) => c.type === 'Connected');

    // If the Connected condition exists, use that (2.6+)
    if (connected) {
      return connected.status === 'True';
    }

    // Otherwise use Ready (older)
    const ready = conditions.find((c) => c.type === 'Ready');

    return ready?.status === 'True';
  }

  get canEdit() {
    return this.canUpdate && this.canCustomEdit;
  }

  // We do not allow users to edit Harvester clusters from Cluster Management, so we need to re-enable that action here.
  get _availableActions() {
    const out = super._availableActions;

    if (!this.canCreateAndManageCluster) {
      const allowActions = ['goToViewYaml', 'download', 'viewInApi'];

      return out.filter((action) => allowActions.includes(action.action));
    }

    const edit = out.find((action) => action.action === 'goToEdit');

    if (edit) {
      edit.enabled = this.canEdit;
    }

    return out;
  }

  get canCreateAndManageCluster() {
    // we check MANAGEMENT.CLUSTER (management.cattle.io.cluster) to avoid standard user role to create or manage the harvester clusters.
    const mgmtClusterSchema = this.$rootGetters['management/schemaFor'](MANAGEMENT.CLUSTER);
    const schema = this.$rootGetters['management/schemaFor'](CAPI.RANCHER_CLUSTER);

    const mgmtClusterManage = !!mgmtClusterSchema?.resourceMethods?.find((x) => x.toLowerCase().includes('put'));
    const clusterManage = !!schema?.resourceMethods?.find((x) => x.toLowerCase() === 'put');

    return clusterManage && mgmtClusterManage;
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

  get disableResourceDetailDrawerConfigTab() {
    // if user is not allowed to create or manage the cluster, we will disable the edit config tab in resource detail drawer.
    return !this.canCreateAndManageCluster;
  }

  get fullDetailPageOverride() {
    return false;
  }
}
