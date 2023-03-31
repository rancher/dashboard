import SteveModel from '@shell/plugins/steve/steve-class';
import { _getCluster, _getGroupByLabel } from '@shell/plugins/steve/resourceUtils/cluster.x-k8s.io.machineset';

export default class CapiMachineSet extends SteveModel {
  get cluster() {
    return _getCluster(this, this.$getters, this.$rootGetters);
  }

  get groupByLabel() {
    return _getGroupByLabel(this, this.$getters, this.$rootGetters);
  }
}
