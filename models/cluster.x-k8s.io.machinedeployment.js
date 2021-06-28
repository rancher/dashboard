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
    return `${ this.$rootGetters['i18n/t']('resourceTable.groupLabel.machinePool', { name: escapeHtml(this.nameDisplay) }) }`;
  },

  groupByPoolShortLabel() {
    return `${ this.$rootGetters['i18n/t']('resourceTable.groupLabel.machinePool', { name: escapeHtml(this.nameDisplay) }) }`;
  },

  templateType() {
    return this.spec.template.spec.infrastructureRef.kind ? `rke-machine.cattle.io.${ this.spec.template.spec.infrastructureRef.kind.toLowerCase() }` : null;
  },

  template() {
    const ref = this.spec.template.spec.infrastructureRef;
    const id = `${ ref.namespace }/${ ref.name }`;
    const template = this.$rootGetters['management/byId'](this.templateType, id);

    return template;
  },

  providerName() {
    return this.template?.nameDisplay;
  },

  providerDisplay() {
    const provider = (this.template?.provider || '').toLowerCase();

    return this.$rootGetters['i18n/withFallback'](`cluster.provider."${ provider }"`, null, 'generic.unknown', true);
  },

  providerLocation() {
    return this.template?.providerLocation || this.t('node.list.poolDescription.noLocation');
  },

  providerSize() {
    return this.template?.providerSize || this.t('node.list.poolDescription.noSize');
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

  scalePool() {
    return (delta) => {
      const clustersMachinePool = this.cluster.spec.rkeConfig.machinePools.find(mp => `${ this.cluster.id }-${ mp.name }` === this.id);

      if (clustersMachinePool) {
        clustersMachinePool.quantity += delta;
        this.cluster.save();
      }
    };
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
