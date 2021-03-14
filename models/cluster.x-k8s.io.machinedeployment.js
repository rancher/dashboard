import { CAPI } from '@/config/types';
import { escapeHtml } from '@/utils/string';
import { sortBy } from '@/utils/sort';

export default {
  cluster() {
    if ( !this.spec.clusterName ) {
      return null;
    }

    const clusterId = `${ this.metadata.namespace }/${ this.spec.clusterName }`;

    const cluster = this.$rootGetters['management/byId'](CAPI.RANCHER_CLUSTER, clusterId);

    return cluster;
  },

  groupByLabel() {
    const name = this.cluster?.nameDisplay || this.spec.clusterName;

    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.cluster', { name: escapeHtml(name) });
  },

  groupByPoolLabel() {
    return `${ this.$rootGetters['i18n/t']('resourceTable.groupLabel.nodePool', { name: escapeHtml(this.nameDisplay) }) }`;
  },

  groupByPoolShortLabel() {
    return `${ this.$rootGetters['i18n/t']('resourceTable.groupLabel.nodePool', { name: escapeHtml(this.nameDisplay.replace(/^.*-nodepool-/, '')) }) }`;
  },

  desired() {
    return this.spec?.replicas || 0;
  },

  pending() {
    return Math.max(0, this.desired - (this.status?.replicas || 0));
  },

  outdated() {
    return Math.max(0, (this.status?.replicas || 0) - (this.status?.updatedReplicas || 0));
  },

  ready() {
    return Math.max(0, (this.status?.replicas || 0) - (this.status?.unavailableReplicas || 0));
  },

  unavailable() {
    return this.status?.unavailableReplicas || 0;
  },

  stateParts() {
    const out = [
      {
        label:     'Pending',
        color:     'bg-info',
        textColor: 'text-info',
        value:     this.pending,
        sort:      1,
      },
      {
        label:     'Outdated',
        color:     'bg-warning',
        textColor: 'text-warning',
        value:     this.outdated,
        sort:      2,
      },
      {
        label:     'Unavailable',
        color:     'bg-error',
        textColor: 'text-error',
        value:     this.unavailable,
        sort:      3,
      },
      {
        label:     'Ready',
        color:     'bg-success',
        textColor: 'text-success',
        value:     this.ready,
        sort:      4,
      },
    ].filter(x => x.value > 0);

    return sortBy(out, 'sort:desc');
  },
};
