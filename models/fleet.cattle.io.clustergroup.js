import { escapeHtml } from '@/utils/string';
import { matching, convert } from '@/utils/selector';
import { FLEET } from '@/config/types';
import { set } from '@/utils/object';

export default {
  applyDefaults() {
    return () => {
      const spec = this.spec || {};

      spec.selector = spec.selector || {};
      spec.selector.matchExpressions = spec.selector.matchExpressions || [];

      set(this, 'spec', spec);
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
