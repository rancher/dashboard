import { escapeHtml } from '@/utils/string';

export default {
  applyDefaults() {
    return () => {
      const spec = this.spec || {};

      this.spec = spec;

      spec.selector = spec.selector || {};
      spec.selector.matchExpressions = spec.selector.matchExpressions || [];
    };
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
