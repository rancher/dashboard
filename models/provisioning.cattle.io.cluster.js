import { CAPI, MANAGEMENT, NORMAN, SNAPSHOT } from '@/config/types';
import SteveModel from '@/plugins/steve/steve-class';
import { findBy, insertAt } from '@/utils/array';
import { get, set } from '@/utils/object';
import { sortBy } from '@/utils/sort';
import { ucFirst } from '@/utils/string';
import { compare } from '@/utils/version';
import { AS, MODE, _VIEW, _YAML } from '@/config/query-params';

export default class ProvCluster extends SteveModel {
  get details() {
    const out = [
      {
        label:   'Provisioner',
        content: this.provisionerDisplay || this.t('generic.none'),
      },
      {
        label:   'Machine Provider',
        content: this.machineProvider ? this.machineProviderDisplay : null,
      },
      {
        label:   'Kubernetes Version',
        content: this.kubernetesVersion,
      },
    ].filter(x => !!x.content);

    if (!this.machineProvider) {
      out.splice(1, 1);

      return out;
    }

    return out;
  }

  get availableActions() {
    // No actions for Harvester clusters
    if (this.isHarvester) {
      return [];
    }

    return this._availableActions;
  }

  get _availableActions() {
    const out = super._availableActions;
    let idx = 0;
    const isLocal = this.mgmt?.isLocal;

    // Don't let the user delete the local cluster from the UI
    if (isLocal) {
      const remove = out.findIndex(a => a.action === 'promptRemove');

      if (remove > -1) {
        out.splice(remove, 1);
      }
    }

    const canSnapshot = (this.isRke2 && this.mgmt?.isReady && this.canUpdate) || (this.isRke1 && this.mgmt?.hasAction('backupEtcd') && this.mgmt?.isReady);

    insertAt(out, idx++, {
      action:     'openShell',
      label:      this.$rootGetters['i18n/t']('nav.shell'),
      icon:       'icon icon-terminal',
      enabled:    !!this.mgmt?.links.shell && this.mgmt?.isReady,
    });

    insertAt(out, idx++, {
      action:     'downloadKubeConfig',
      bulkAction: 'downloadKubeConfigBulk',
      label:      this.$rootGetters['i18n/t']('nav.kubeconfig.download'),
      icon:       'icon icon-download',
      bulkable:   true,
      enabled:    this.mgmt?.hasAction('generateKubeconfig') && this.mgmt?.isReady,
    });

    insertAt(out, idx++, {
      action:     'snapshotAction',
      label:      this.$rootGetters['i18n/t']('nav.takeSnapshot'),
      icon:       'icon icon-snapshot',
      bulkAction: 'snapshotBulk',
      bulkable:   true,
      enabled:    canSnapshot,
    });

    insertAt(out, idx++, {
      action:  'restoreSnapshotAction',
      label:      this.$rootGetters['i18n/t']('nav.restoreSnapshot'),
      icon:    'icon icon-fw icon-backup-restore',
      enabled: canSnapshot,
    });

    insertAt(out, idx++, {
      action:     'rotateCertificates',
      label:      this.$rootGetters['i18n/t']('nav.rotateCertificates'),
      icon:       'icon icon-backup',
      enabled:    (this.isRke2 && this.mgmt?.isReady && this.canUpdate) || (this.mgmt?.hasAction('rotateCertificates') && this.mgmt?.isReady),
    });

    insertAt(out, idx++, {
      action:     'rotateEncryptionKey',
      label:      this.$rootGetters['i18n/t']('nav.rotateEncryptionKeys'),
      icon:       'icon icon-refresh',
      enabled:     this.isRke1 && this.mgmt?.hasAction('rotateEncryptionKey') && this.mgmt?.isReady,
    });

    insertAt(out, idx++, {
      action:     'saveAsRKETemplate',
      label:      this.$rootGetters['i18n/t']('nav.saveAsRKETemplate'),
      icon:       'icon icon-folder',
      enabled:    this.isRke1 && this.mgmt?.status?.driver === 'rancherKubernetesEngine' && !this.mgmt?.spec?.clusterTemplateName && this.hasLink('update'),
    });

    insertAt(out, idx++, { divider: true });

    return out;
  }

  goToViewYaml() {
    let location;

    if ( !this.isRke2 ) {
      location = this.mgmt?.detailLocation;
    }

    if ( !location ) {
      location = this.detailLocation;
    }

    location.query = {
      ...location.query,
      [MODE]: _VIEW,
      [AS]:   _YAML
    };

    this.currentRouter().push(location);
  }

  get canEditYaml() {
    if (!this.isRke2) {
      return false;
    }

    return super.canEditYaml;
  }

  get isImported() {
    return this.provisioner === 'imported';
  }

  get isCustom() {
    if ( this.isRke2 ) {
      return !(this.spec?.rkeConfig?.machinePools?.length);
    }

    if ( this.isRke1 ) {
      return !this.pools?.length;
    }

    return false;
  }

  get isImportedK3s() {
    return this.isImported && this.mgmt?.status?.provider === 'k3s';
  }

  get isImportedRke2() {
    return this.isImported && this.mgmt?.status?.provider?.startsWith('rke2');
  }

  get isRke2() {
    return !!this.spec?.rkeConfig;
  }

  get isRke1() {
    return !!this.mgmt?.spec?.rancherKubernetesEngineConfig;
  }

  get isHarvester() {
    return !!this.mgmt?.isHarvester;
  }

  get mgmtClusterId() {
    return this.mgmt?.id || this.id.replace(`${ this.metadata.namespace }/`, '');
  }

  get mgmt() {
    const name = this.status?.clusterName;

    if ( !name ) {
      return null;
    }

    const out = this.$rootGetters['management/byId'](MANAGEMENT.CLUSTER, name);

    return out;
  }

  waitForProvisioner(timeout, interval) {
    return this.waitForTestFn(() => {
      return !!this.provisioner;
    }, `set provisioner`, timeout, interval);
  }

  waitForMgmt(timeout, interval) {
    return this.waitForTestFn(() => {
      // `this` instance isn't getting updated with `status.clusterName`
      // Workaround - Get fresh copy from the store
      const pCluster = this.$rootGetters['management/byId'](CAPI.RANCHER_CLUSTER, this.id);
      const name = this.status?.clusterName || pCluster?.status?.clusterName;

      return name && !!this.$rootGetters['management/byId'](MANAGEMENT.CLUSTER, name);
    }, `mgmt cluster create`, timeout, interval);
  }

  get provisioner() {
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
    }

    return null;
  }

  get provisionerDisplay() {
    let provisioner = (this.provisioner || '').toLowerCase();

    // RKE provisioner can actually do K3s too...
    if ( provisioner === 'rke2' && this.spec?.kubernetesVersion?.includes('k3s') ) {
      provisioner = 'k3s';
    } else if ( this.isImportedK3s ) {
      provisioner = 'k3s';
    } else if ( this.isImportedRke2 ) {
      provisioner = 'rke2';
    }

    return this.$rootGetters['i18n/withFallback'](`cluster.provider."${ provisioner }"`, null, ucFirst(provisioner));
  }

  get kubernetesVersion() {
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
  }

  get machineProvider() {
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

    return null;
  }

  get machineProviderDisplay() {
    if ( this.isImported ) {
      return null;
    }

    const provider = (this.machineProvider || '').toLowerCase();

    if ( provider ) {
      return this.$rootGetters['i18n/withFallback'](`cluster.provider."${ provider }"`, null, provider);
    } else {
      return this.$rootGetters['i18n/t']('generic.unknown');
    }
  }

  get nodes() {
    return this.$rootGetters['management/all'](MANAGEMENT.NODE).filter(node => node.id.startsWith(this.mgmtClusterId));
  }

  get machines() {
    return this.$rootGetters['management/all'](CAPI.MACHINE).filter((machine) => {
      if ( machine.metadata?.namespace !== this.metadata.namespace ) {
        return false;
      }

      return machine.spec?.clusterName === this.metadata.name;
    });
  }

  get displayName() {
    if ( this.mgmt && !this.isRke2 ) {
      return this.mgmt.spec.displayName;
    }

    return null;
  }

  get pools() {
    const deployments = this.$rootGetters['management/all'](CAPI.MACHINE_DEPLOYMENT).filter(pool => pool.spec?.clusterName === this.metadata.name);

    if (!!deployments.length) {
      return deployments;
    }

    return this.$rootGetters['management/all'](MANAGEMENT.NODE_POOL).filter(pool => pool.spec.clusterName === this.status?.clusterName);
  }

  get desired() {
    return this.pools.reduce((acc, pool) => acc + (pool.desired || 0), 0);
  }

  get pending() {
    return this.pools.reduce((acc, pool) => acc + (pool.pending || 0), 0);
  }

  get outdated() {
    return this.pools.reduce((acc, pool) => acc + (pool.outdated || 0), 0);
  }

  get ready() {
    return this.pools.reduce((acc, pool) => acc + (pool.ready || 0), 0);
  }

  get unavailable() {
    return this.pools.reduce((acc, pool) => acc + (pool.unavailable || 0), 0);
  }

  get stateParts() {
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
  }

  async getOrCreateToken() {
    await this.waitForMgmt();

    if ( !this.mgmt ) {
      return;
    }

    const tokens = await this.$dispatch('rancher/findAll', { type: NORMAN.CLUSTER_TOKEN, force: true }, { root: true });

    let token = findBy(tokens, 'clusterId', this.mgmt.id);

    if ( token ) {
      return token;
    }

    if ( !this.links.update ) {
      return;
    }

    token = await this.$dispatch('rancher/create', {
      type:      NORMAN.CLUSTER_TOKEN,
      clusterId: this.mgmt.id
    }, { root: true });

    return token.save();
  }

  openShell() {
    return this.mgmt?.openShell();
  }

  generateKubeConfig() {
    return this.mgmt?.generateKubeConfig();
  }

  downloadKubeConfig() {
    return this.mgmt?.downloadKubeConfig();
  }

  downloadKubeConfigBulk(items) {
    return this.mgmt?.downloadKubeConfigBulk(items);
  }

  async snapshotAction() {
    try {
      await this.takeSnapshot();
      this.$dispatch('growl/success', {
        title:   this.$rootGetters['i18n/t']('cluster.snapshot.successTitle', { name: this.nameDisplay }),
        message: this.$rootGetters['i18n/t']('cluster.snapshot.successMessage', { name: this.nameDisplay })
      }, { root: true });
    } catch (err) {
      this.$dispatch('growl/fromError', {
        title: this.$rootGetters['i18n/t']('cluster.snapshot.errorTitle', { name: this.nameDisplay }),
        err,
      }, { root: true });
    }
  }

  async snapshotBulk(items) {
    const res = await Promise.allSettled(items.map((row) => {
      return row.takeSnapshot();
    }));

    const successful = res.filter( x => x.status === 'fulfilled').length;

    if ( successful ) {
      this.$dispatch('growl/success', {
        title:   this.$rootGetters['i18n/t']('cluster.snapshot.bulkSuccessTitle'),
        message: this.$rootGetters['i18n/t']('cluster.snapshot.bulkSuccessMessage', { count: successful })
      }, { root: true });
    }

    for ( let i = 0 ; i < res.length ; i++ ) {
      if ( res[i].status !== 'fulfilled' ) {
        this.$dispatch('growl/fromError', {
          title: this.$rootGetters['i18n/t']('cluster.snapshot.errorTitle', { name: items[i].nameDisplay }),
          err:   res[i].value,
        }, { root: true });
      }
    }
  }

  takeSnapshot() {
    if ( this.isRke1 ) {
      return this.$dispatch('rancher/request', {
        url:           `/v3/clusters/${ escape(this.mgmt.id) }?action=backupEtcd`,
        method:        'post',
      }, { root: true });
    } else {
      const now = this.spec?.rkeConfig?.etcdSnapshotCreate?.generation || 0;
      const args = { generation: now + 1 };

      if ( this.spec?.rkeConfig?.etcd?.s3 ) {
        args.s3 = this.spec.rkeConfig.etcd.s3;
      }

      set(this.spec.rkeConfig, 'etcdSnapshotCreate', args);

      return this.save();
    }
  }

  get etcdSnapshots() {
    const allSnapshots = this.$rootGetters['management/all']({ type: SNAPSHOT });

    return allSnapshots
      .filter(s => s.metadata.namespace === this.namespace && s.clusterName === this.name );
  }

  restoreSnapshotAction(resource = this) {
    this.$dispatch('promptRestore', [resource]);
  }

  saveAsRKETemplate(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'SaveAsRKETemplateDialog'
    });
  }

  rotateCertificates(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'RotateCertificatesDialog'
    });
  }

  rotateEncryptionKey(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'RotateEncryptionKeyDialog'
    });
  }

  get stateObj() {
    if ( this.isHarvester) {
      return {
        error:         true,
        message:       this.$rootGetters['i18n/t']('cluster.harvester.warning.label'),
        name:          this.$rootGetters['i18n/t']('cluster.harvester.warning.state'),
        transitioning: false
      };
    }

    return this._stateObj;
  }

  get _stateObj() {
    if (!this.isRke2) {
      return this.mgmt?.stateObj || this.metadata?.state;
    }

    return this.metadata?.state;
  }

  get supportsWindows() {
    if ( this.isRke1 ) {
      return this.mgmt?.spec?.windowsPreferedCluster || false;
    }

    if ( !this.isRke2 ) {
      return false;
    }

    if ( !this.kubernetesVersion || compare(this.kubernetesVersion, 'v1.21.0') < 0 ) {
      return false;
    }

    const cni = this.spec?.rkeConfig?.machineGlobalConfig?.cni;

    if ( cni && cni !== 'calico' ) {
      return false;
    }

    return true;
  }

  get customValidationRules() {
    return [
      {
        path:           'metadata.name',
        translationKey: 'cluster.name.label',
        validators:     [`clusterName:${ this.isRke2 }`],
      },
    ];
  }

  get canClone() {
    return false;
  }

  async remove(opt = {}) {
    if ( !opt.url ) {
      opt.url = (this.links || {})['self'];
    }

    opt.method = 'delete';

    const res = await this.$dispatch('request', opt);

    const pool = (this.spec?.rkeConfig?.machinePools || [])[0];

    if (pool?.machineConfigRef?.kind === 'HarvesterConfig') {
      const cloudCredentialSecretName = this.spec.cloudCredentialSecretName;

      await this.$dispatch('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL }, { root: true });

      const credential = this.$rootGetters['rancher/byId'](NORMAN.CLOUD_CREDENTIAL, cloudCredentialSecretName);

      if (credential) {
        const harvesterClusterId = get(credential, 'decodedData.clusterId');

        try {
          const poolConfig = await this.$dispatch('management/find', {
            type: `${ CAPI.MACHINE_CONFIG_GROUP }.${ (pool?.machineConfigRef?.kind || '').toLowerCase() }`,
            id:   `${ this.metadata.namespace }/${ pool?.machineConfigRef?.name }`,
          }, { root: true });

          await this.$dispatch('management/request', {
            url:                  `/k8s/clusters/${ harvesterClusterId }/v1/harvester/serviceaccounts/${ poolConfig.vmNamespace }/${ this.metadata.name }`,
            method:               'DELETE',
          }, { root: true });
        } catch (e) {
          console.error(e); // eslint-disable-line no-console
        }
      }
    }

    if ( res?._status === 204 ) {
      await this.$dispatch('ws.resource.remove', { data: this });
    }
  }
}
