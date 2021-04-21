import { CAPI, MANAGEMENT } from '@/config/types';
import { sortBy } from '@/utils/sort';

export const DEFAULT_WORKSPACE = 'fleet-default';

export default {
  details() {
    const out = [
      {
        label:   'Provisioner',
        content: this.provisionerDisplay
      },
      {
        label:   'Node Provider',
        content: this.nodeProviderDisplay
      },
      {
        label:   'Kubernetes Version',
        content: this.kubernetesVersion,
      },
    ];

    return out;
  },

  isRke2() {
    return !!this.spec?.rkeConfig;
  },

  mgmt() {
    const name = this.status?.clusterName;

    if ( !name ) {
      return null;
    }

    const out = this.$getters['byId'](MANAGEMENT.CLUSTER, name);

    return out;
  },

  provisioner() {
    if ( this.isRke2 ) {
      const allKeys = Object.keys(this.spec);
      const configKey = allKeys.find( k => k.endsWith('Config'));

      if ( configKey === 'rkeConfig') {
        return 'rke2';
      } else if ( configKey ) {
        return configKey.replace(/config$/i, '');
      }
    } else if ( this.mgmt ) {
      return this.mgmt.provisioner;
    } else {
      return null;
    }
  },

  provisionerDisplay() {
    let provisioner = (this.provisioner || '').toLowerCase();

    // RKE provisioner can actually do K3s too...
    if ( provisioner === 'rke2' && this.spec.kubernetesVersion.includes('k3s') ) {
      provisioner = 'k3s';
    }

    return this.$rootGetters['i18n/withFallback'](`cluster.provider."${ provisioner }"`, null, 'generic.unknown', true);
  },

  kubernetesVersion() {
    const unknown = this.$rootGetters['i18n/t']('generic.unknown');

    if ( this.isRke2 ) {
      const fromStatus = this.status?.version?.gitVersion;
      const fromSpec = this.spec?.kubernetesVersion;

      return fromStatus || fromSpec || unknown;
    } else if ( this.mgmt ) {
      return this.mgmt.kubernetesVersion || unknown;
    } else {
      return unknown;
    }
  },

  nodeProvider() {
    if ( this.isRke2 ) {
      const kind = this.spec?.rkeConfig?.nodePools?.[0]?.nodeConfig?.kind;

      if ( kind ) {
        return kind.replace(/config$/i, '');
      }

      return null;
    } else if ( this.mgmt ) {
      return this.mgmt.nodeProvider;
    }
  },

  nodeProviderDisplay() {
    const provider = (this.nodeProvider || '').toLowerCase();

    return this.$rootGetters['i18n/withFallback'](`cluster.provider."${ provider }"`, null, 'generic.unknown', true);
  },

  displayName() {
    if ( this.mgmt && !this.isRke2 ) {
      return this.mgmt.spec.displayName;
    }
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
