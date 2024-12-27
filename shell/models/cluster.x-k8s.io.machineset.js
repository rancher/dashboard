import { CAPI } from '@shell/config/types';
import { escapeHtml } from '@shell/utils/string';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class CapiMachineSet extends SteveModel {
  get cluster() {
    if ( !this.spec.clusterName ) {
      return null;
    }

    const clusterId = `${ this.metadata.namespace }/${ this.spec.clusterName }`;

    const cluster = this.$rootGetters['management/byId'](CAPI.RANCHER_CLUSTER, clusterId);

    return cluster;
  }

  get groupByCluster() {
    const ns = this.metadata.namespace;
    const name = this.cluster?.nameDisplay || this.spec.clusterName;
    const nsName = escapeHtml(`${ ns }/${ name }`);

    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.cluster', { name: nsName });
  }
}
