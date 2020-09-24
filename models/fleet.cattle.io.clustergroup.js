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
    const workspace = this.$getters['byId'](FLEET.WORKSPACE, this.metadata.namespace);
    const expressions = convert(this.spec?.matchLabels || {}, this.spec?.matchExpressions || []);

    if ( !expressions.length ) {
      return workspace.clusters;
    }

    const match = matching(workspace.clusters, expressions);

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
