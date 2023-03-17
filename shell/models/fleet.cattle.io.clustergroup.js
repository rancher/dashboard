import { matching, convert } from '@shell/utils/selector';
import { FLEET } from '@shell/config/types';
import { set } from '@shell/utils/object';
import SteveModel from '@shell/plugins/steve/steve-class';
import { _getGroupByLabel } from '@shell/plugins/steve/resourceUtils/fleet.cattle.io.clusterGroup';

export default class FleetClusterGroup extends SteveModel {
  applyDefaults() {
    const spec = this.spec || {};

    spec.selector = spec.selector || {};
    spec.selector.matchExpressions = spec.selector.matchExpressions || [];

    set(this, 'spec', spec);
  }

  get targetClusters() {
    const workspace = this.$getters['byId'](FLEET.WORKSPACE, this.metadata.namespace);
    const expressions = convert(this.spec?.selector?.matchLabels || {}, this.spec?.selector?.matchExpressions || []);

    if ( !expressions.length ) {
      return workspace.clusters;
    }

    const match = matching(workspace.clusters, expressions);

    return match;
  }

  get groupByLabel() {
    return _getGroupByLabel(this, { translate: this.$rootGetters['i18n/t'] });
  }

  get clusterInfo() {
    const total = this.status?.clusterCount || 0;
    const unready = this.status?.nonReadyClusterCount || 0;
    const ready = total - unready;

    return {
      ready,
      unready,
      total,
    };
  }

  get details() {
    const out = [
      {
        label:   'Clusters Ready',
        content: `${ this.clusterInfo.ready } of ${ this.clusterInfo.total }`,
      },
    ];

    return out;
  }
}
