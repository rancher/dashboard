import { escapeHtml } from '@/utils/string';
import { matching, convert } from '@/utils/selector';
import { FLEET } from '@/config/types';

export default {
  applyDefaults() {
    return () => {
      const spec = this.spec || {};

      this.spec = spec;

      spec.selector = spec.selector || {};
      spec.selector.matchExpressions = spec.selector.matchExpressions || [];
    };
  },

  targetClusters() {
    const all = this.$getters['all'](FLEET.CLUSTER);
    const expressions = convert(this.spec?.matchLabels || {}, this.spec?.matchExpressions || []);
    const match = matching(all, expressions);

    return match;
  },

  groupByLabel() {
    const name = this.metadata.namespace;

    if ( name ) {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.workspace', { name: escapeHtml(name) });
    } else {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAWorkspace');
    }
  },
};
