import { CATALOG } from '@shell/config/types';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class ClusterScanBenchmark extends SteveModel {
  warnDeletionMessage(toRemove = []) {
    return this.$rootGetters['i18n/t']('cis.deleteBenchmarkWarning', { count: toRemove.length });
  }

  get isDefault() {
    const { relationships = [] } = this.metadata;

    if (!relationships) {
      return false;
    }

    return relationships.filter((rel) => rel.fromType === CATALOG.APP ).length > 0;
  }
}
