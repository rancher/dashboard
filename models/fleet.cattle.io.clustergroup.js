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
    const expressions = convert(this.spec?.selector?.matchLabels || {}, this.spec?.selector?.matchExpressions || []);

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

  clusterInfo() {
    const total = this.status?.clusterCount || 0;
    const unready = this.status?.nonReadyClusterCount || 0;
    const ready = total - unready;

    return {
      ready,
      unready,
      total,
    };
  },

  details() {
    const out = [
      {
        label:   'Clusters Ready',
        content:  `${ this.clusterInfo.ready } of ${ this.clusterInfo.total }`,
      },
    ];

    return out;
  },
};
