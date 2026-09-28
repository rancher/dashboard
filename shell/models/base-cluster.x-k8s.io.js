import { escapeHtml } from '@shell/utils/string';
import SteveModel from '@shell/plugins/steve/steve-class';
import { CAPI } from '@shell/config/types';

export default class CapiMachineRoot extends SteveModel {
  get cluster() {
    if ( !this.spec.clusterName ) {
      return null;
    }

    // This is used to get the cluster's human name
    // Ideally we get this via the management cluster. To find it though we have to go via the provisioning cluster. So might as well just use that

    const clusterId = `${ this.metadata.namespace }/${ this.spec.clusterName }`;

    return this.$rootGetters['management/byId'](CAPI.RANCHER_CLUSTER, clusterId);
  }

  get clusterName() {
    return this.cluster?.nameDisplay || this.spec.clusterName;
  }

  get groupByLabel() {
    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.cluster', { name: escapeHtml(this.clusterName) });
  }
}
