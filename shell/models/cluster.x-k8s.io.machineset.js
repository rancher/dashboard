import { MANAGEMENT } from '@shell/config/types';
import { escapeHtml } from '@shell/utils/string';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class CapiMachineSet extends SteveModel {
  get cluster() {
    // TODO: RC confirm with kinara - is prov id ns/"name" === mgmt name
    return this.$rootGetters['management/byId'](MANAGEMENT.CLUSTER, this.spec.clusterName); // TODO: RC test
  }

  get groupByLabel() {
    const name = this.cluster?.nameDisplay || this.spec.clusterName;

    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.cluster', { name: escapeHtml(name) });
  }
}
