import SteveModel from '@shell/plugins/steve/steve-class';
import { _getIsDefault } from '@shell/plugins/steve/resourceUtils/cis.cattle.io.clusterscanbenchmark';

export default class ClusterScanBenchmark extends SteveModel {
  warnDeletionMessage(toRemove = []) {
    return this.$rootGetters['i18n/t']('cis.deleteBenchmarkWarning', { count: toRemove.length });
  }

  get isDefault() {
    return _getIsDefault(this);
  }
}
