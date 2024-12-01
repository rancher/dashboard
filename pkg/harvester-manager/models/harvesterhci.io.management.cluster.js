import ProvCluster from '@shell/models/provisioning.cattle.io.cluster';
import { DEFAULT_WORKSPACE, HCI } from '@shell/config/types';
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
