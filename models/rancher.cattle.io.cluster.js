import { CAPI } from '@/config/types';
import { sortBy } from '@/utils/sort';

export const DEFAULT_WORKSPACE = 'fleet-default';

export default {
  details() {
    const out = [
      {
        label:   'Provider',
        content: this.nodeProvider
      },
      {
        label:   'Kubernetes Version',
        content: this.spec.kubernetesVersion,
      },
    ];

    return out;
  },

  nodeProvider() {
    const kind = this.spec?.rkeConfig?.nodePools?.[0]?.nodeConfig?.kind;

    if ( kind ) {
      return kind.replace(/config$/i, '').toLowerCase();
    }
  },

  nodeProviderDisplay() {
    const provider = this.nodeProvider;

    return this.$getters['i18n/withFallback'](`cluster.provider."${ provider }"`, null, 'generic.unknown', true);
  },

  pools() {
    return this.$getters['all'](CAPI.MACHINE_DEPLOYMENT).filter(pool => pool.spec?.clusterName === this.metadata.name);
  },

  desired() {
    return this.pools.reduce((acc, pool) => acc + (pool.desired || 0), 0);
  },

  pending() {
    return this.pools.reduce((acc, pool) => acc + (pool.pending || 0), 0);
  },

  outdated() {
    return this.pools.reduce((acc, pool) => acc + (pool.outdated || 0), 0);
  },

  ready() {
    return this.pools.reduce((acc, pool) => acc + (pool.ready || 0), 0);
  },

  unavailable() {
    return this.pools.reduce((acc, pool) => acc + (pool.unavailable || 0), 0);
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
