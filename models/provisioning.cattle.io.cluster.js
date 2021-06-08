import { CAPI, MANAGEMENT, NORMAN } from '@/config/types';
import { proxyFor } from '@/plugins/steve/resource-proxy';
import { findBy, insertAt } from '@/utils/array';
import { sortBy } from '@/utils/sort';
import { ucFirst } from '@/utils/string';

export const DEFAULT_WORKSPACE = 'fleet-default';

export default {
  details() {
    const out = [
      {
        label:   'Provisioner',
        content: this.provisionerDisplay
      },
      {
        label:   'Machine Provider',
        content: this.machineProviderDisplay
      },
      {
        label:   'Kubernetes Version',
        content: this.kubernetesVersion,
      },
    ];

    return out;
  },

  _availableActions() {
    const out = this._standardActions;

    insertAt(out, 0, {
      action:     'openShell',
      label:      'Kubectl Shell',
      icon:       'icon icon-terminal',
      enabled:    !!this.mgmt?.links.shell,
    });

    insertAt(out, 1, {
      action:     'downloadKubeConfig',
      bulkAction: 'downloadKubeConfigBulk',
      label:      'Download KubeConfig',
      icon:       'icon icon-download',
      bulkable:   true,
      enabled:    this.$rootGetters['isRancher'],
    });

    const canSaveAsTemplate = this.isRke1 && this.mgmt.status.driver === 'rancherKubernetesEngine' && !this.mgmt.spec.clusterTemplateName && this.hasLink('update');
    const canRotateEncryptionKey = this.isRke1 && this.mgmt?.hasAction('rotateEncryptionKey');

    if (canSaveAsTemplate || canRotateEncryptionKey) {
      insertAt(out, 2, { divider: true });

      let insertIndex = 3;

      if (canSaveAsTemplate) {
        insertAt(out, insertIndex, {
          action:     'saveAsRKETemplate',
          label:      'Save as RKE Template',
          icon:       'icon icon-folder',
          bulkable:   false,
          enabled:    this.$rootGetters['isRancher'],
        });
        insertIndex++;
      }

      if (canRotateEncryptionKey) {
        insertAt(out, insertIndex, {
          action:     'rotateEncryptionKey',
          label:      'Rotate Encryption Keys',
          icon:       'icon icon-refresh',
          bulkable:   false,
          enabled:    this.$rootGetters['isRancher'],
        });
      }
    }

    return out;
  },

  isImported() {
    return this.provisioner === 'imported';
  },

  isCustom() {
    return this.isRke2 && !(this.spec?.rkeConfig?.machinePools?.length);
  },

  isRke2() {
    return !!this.spec?.rkeConfig;
  },

  isRke1() {
    return !!this.mgmt?.spec?.rancherKubernetesEngineConfig;
  },

  mgmt() {
    const name = this.status?.clusterName;

    if ( !name ) {
      return null;
    }

    const out = this.$getters['byId'](MANAGEMENT.CLUSTER, name);

    return out;
  },

  waitForMgmt() {
    return (timeout, interval) => {
      return this.waitForTestFn(() => {
        const name = this.status?.clusterName;

        return name && !!this.$getters['byId'](MANAGEMENT.CLUSTER, name);
      }, `mgmt cluster create`, timeout, interval);
    };
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
    if ( provisioner === 'rke2' && this.spec?.kubernetesVersion?.includes('k3s') ) {
      provisioner = 'k3s';
    }

    return this.$rootGetters['i18n/withFallback'](`cluster.provider."${ provisioner }"`, null, ucFirst(provisioner));
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

  machineProvider() {
    if ( this.isImported ) {
      return null;
    } else if ( this.isRke2 ) {
      const kind = this.spec?.rkeConfig?.machinePools?.[0]?.machineConfigRef?.kind?.toLowerCase();

      if ( kind ) {
        return kind.replace(/config$/i, '').toLowerCase();
      }

      return null;
    } else if ( this.mgmt?.machineProvider ) {
      return this.mgmt.machineProvider.toLowerCase();
    }
  },

  machineProviderDisplay() {
    if ( this.isImported ) {
      return null;
    }

    const provider = (this.machineProvider || '').toLowerCase();

    if ( provider ) {
      return this.$rootGetters['i18n/withFallback'](`cluster.provider."${ provider }"`, null, provider);
    } else {
      return this.$rootGetters['i18n/t']('generic.unknown');
    }
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

  getOrCreateToken() {
    return async() => {
      await this.waitForMgmt();

      if ( !this.mgmt ) {
        return;
      }

      const tokens = await this.$dispatch('rancher/findAll', { type: NORMAN.CLUSTER_TOKEN, force: true }, { root: true });

      let token = findBy(tokens, 'clusterId', this.mgmt.id);

      if ( token ) {
        return token;
      }

      token = await this.$dispatch('rancher/create', {
        type:      NORMAN.CLUSTER_TOKEN,
        clusterId: this.mgmt.id
      }, { root: true });

      return token.save();
    };
  },

  openShell() {
    return () => {
      return this.mgmt?.openShell();
    };
  },

  generateKubeConfig() {
    return () => {
      return this.mgmt?.generateKubeConfig();
    };
  },

  downloadKubeConfig() {
    return () => {
      return this.mgmt?.downloadKubeConfig();
    };
  },

  downloadKubeConfigBulk() {
    return (items) => {
      return this.mgmt?.downloadKubeConfigBulk(items);
    };
  },

  etcdSnapshots() {
    return (this.status?.etcdSnapshots || []).map((x) => {
      x.id = x.name || x._name;
      x.type = 'etcdBackup';
      x.state = 'active';
      x.clusterId = this.id;
      x.rke2 = true;

      return proxyFor(this.$ctx, x);
    });
  },

  saveAsRKETemplate() {
    return (resources = this) => {
      this.$dispatch('promptModal', {
        resources,
        component: 'SaveAsRKETemplateDialog'
      });
    };
  },

  rotateEncryptionKey() {
    return (resources = this) => {
      this.$dispatch('promptModal', {
        resources,
        component: 'RotateEncryptionKeyDialog'
      });
    };
  }

};
