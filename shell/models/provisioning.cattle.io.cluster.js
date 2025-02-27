import {
  CAPI, MANAGEMENT, NAMESPACE, NORMAN, SNAPSHOT, HCI, LOCAL_CLUSTER
} from '@shell/config/types';
import SteveModel from '@shell/plugins/steve/steve-class';
import { findBy } from '@shell/utils/array';
import { get, set } from '@shell/utils/object';
import { sortBy } from '@shell/utils/sort';
import { ucFirst } from '@shell/utils/string';
import { compare } from '@shell/utils/version';
import { AS, MODE, _VIEW, _YAML } from '@shell/config/query-params';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/features';
import { CAPI as CAPI_ANNOTATIONS, NODE_ARCHITECTURE } from '@shell/config/labels-annotations';
import { KEV1 } from '@shell/models/management.cattle.io.kontainerdriver';

/**
 * Class representing Cluster resource.
 * @extends SteveModel
 */
export default class ProvCluster extends SteveModel {
  get details() {
    const out = [
      {
        label:   this.t('cluster.detail.provisioner'),
        content: this.provisionerDisplay || this.t('generic.none'),
      },
      {
        label:   this.t('cluster.detail.machineProvider'),
        content: this.machineProvider ? this.machineProviderDisplay : null,
      },
      {
        label:   this.t('cluster.detail.kubernetesVersion'),
        content: this.kubernetesVersion,
      },
      {
        label:   this.t('cluster.detail.machinePools'),
        content: this.pools.length,
      },
      {
        label:   this.t('cluster.detail.machines'),
        content: this.desired,
      },
    ].filter((x) => !!x.content);

    // RKE Template details
    const rkeTemplate = this.rkeTemplate;

    if (rkeTemplate) {
      out.push({
        label:     this.t('cluster.detail.rkeTemplate'),
        formatter: 'RKETemplateName',
        content:   rkeTemplate,
      });
    }

    if (!this.machineProvider) {
      out.splice(1, 1);

      return out;
    }

    return out;
  }

  // using this computed because on the provisioning cluster we are
  // displaying the oldest age between provisioning.cluster and management.cluster
  // so that on a version upgrade of Rancher (ex: 2.5.x to 2.6.x)
  // we can have the correct age of the cluster displayed on the UI side
  get creationTimestamp() {
    const provCreationTimestamp = Date.parse(this.metadata?.creationTimestamp);
    const mgmtCreationTimestamp = Date.parse(this.mgmt?.metadata?.creationTimestamp);

    if (mgmtCreationTimestamp && mgmtCreationTimestamp < provCreationTimestamp) {
      return this.mgmt?.metadata?.creationTimestamp;
    }

    return super.creationTimestamp;
  }

  // Models can specify a single action that will be shown as a button in the details masthead
  get detailsAction() {
    const canExplore = this.mgmt?.isReady && !this.hasError;

    return {
      action:  'explore',
      label:   this.$rootGetters['i18n/t']('cluster.explore'),
      enabled: canExplore,
    };
  }

  get _availableActions() {
    const out = super._availableActions;
    const isLocal = this.mgmt?.isLocal;

    // Don't let the user delete the local cluster from the UI
    if (isLocal) {
      const remove = out.findIndex((a) => a.action === 'promptRemove');

      if (remove > -1) {
        out.splice(remove, 1);
      }
    }
    const ready = this.mgmt?.isReady;

    const canEditRKE2cluster = this.isRke2 && ready && this.canUpdate;

    const canSnapshot = ready && ((this.isRke2 && this.canUpdate) || (this.isRke1 && this.mgmt?.hasAction('backupEtcd')));

    const clusterTemplatesSchema = this.$getters['schemaFor']('management.cattle.io.clustertemplate');
    let canUpdateClusterTemplate = false;

    if (clusterTemplatesSchema && (clusterTemplatesSchema.resourceMethods?.includes('blocked-PUT') || clusterTemplatesSchema.resourceMethods?.includes('PUT'))) {
      canUpdateClusterTemplate = true;
    }

    const normanClusterSaveTemplateAction = !!this.normanCluster?.actions?.saveAsTemplate;

    const canSaveRKETemplate = this.isRke1 && this.mgmt?.status?.driver === 'rancherKubernetesEngine' && !this.mgmt?.spec?.clusterTemplateName && this.hasLink('update') && canUpdateClusterTemplate && normanClusterSaveTemplateAction;

    const actions = [
      // Note: Actions are not supported in the Steve API, so we check
      // available actions for RKE1 clusters, but not RKE2 clusters.
      {
        action:  'openShell',
        label:   this.$rootGetters['i18n/t']('nav.shell'),
        icon:    'icon icon-terminal',
        enabled: !!this.mgmt?.links.shell && ready,
      }, {
        action:     'downloadKubeConfig',
        bulkAction: 'downloadKubeConfigBulk',
        label:      this.$rootGetters['i18n/t']('nav.kubeconfig.download'),
        icon:       'icon icon-download',
        bulkable:   true,
        enabled:    this.mgmt?.hasAction('generateKubeconfig'),
      }, {
        action:   'copyKubeConfig',
        label:    this.t('cluster.copyConfig'),
        bulkable: false,
        enabled:  this.mgmt?.hasAction('generateKubeconfig'),
        icon:     'icon icon-copy',
      }, {
        action:     'snapshotAction',
        label:      this.$rootGetters['i18n/t']('nav.takeSnapshot'),
        icon:       'icon icon-snapshot',
        bulkAction: 'snapshotBulk',
        bulkable:   true,
        enabled:    canSnapshot,
      }, {
        action:  'restoreSnapshotAction',
        label:   this.$rootGetters['i18n/t']('nav.restoreSnapshot'),
        icon:    'icon icon-fw icon-backup-restore',
        enabled: canSnapshot,
      }, {
        action:  'rotateCertificates',
        label:   this.$rootGetters['i18n/t']('nav.rotateCertificates'),
        icon:    'icon icon-backup',
        enabled: canEditRKE2cluster || (this.mgmt?.hasAction('rotateCertificates') && ready),
      }, {
        action:  'rotateEncryptionKey',
        label:   this.$rootGetters['i18n/t']('nav.rotateEncryptionKeys'),
        icon:    'icon icon-refresh',
        enabled: canEditRKE2cluster || (this.isRke1 && this.mgmt?.hasAction('rotateEncryptionKey') && ready)
      }, {
        action:  'saveAsRKETemplate',
        label:   this.$rootGetters['i18n/t']('nav.saveAsRKETemplate'),
        icon:    'icon icon-folder',
        enabled: canSaveRKETemplate,
      }, { divider: true }];

    // Harvester Cluster 1:1 Harvester Cloud Cred
    if (this.cloudCredential?.canRenew || this.cloudCredential?.canBulkRenew) {
      out.splice(0, 0, { divider: true });
      out.splice(0, 0, {
        action:     'renew',
        enabled:    this.cloudCredential?.canRenew,
        bulkable:   this.cloudCredential?.canBulkRenew,
        bulkAction: 'renewBulk',
        icon:       'icon icon-fw icon-refresh',
        label:      this.$rootGetters['i18n/t']('cluster.cloudCredentials.renew'),
      });
    }

    const all = actions.concat(out);

    // If the cluster is a KEV1 cluster then prevent edit
    if (this.isKev1) {
      const edit = all.find((action) => action.action === 'goToEdit');

      if (edit) {
        edit.enabled = false;
      }
    }

    // If we have a helper that wants to modify the available actions, let it do it
    if (this.customProvisionerHelper?.availableActions) {
      // Provider can either modify the provided list or return one of its own
      return this.customProvisionerHelper?.availableActions(this, all) || all;
    }

    return all;
  }

  get detailLocation() {
    // Prevent going to detail page for a KEV1 cluster
    if (this.isKev1) {
      return undefined;
    }

    return super.detailLocation;
  }

  get normanCluster() {
    const name = this.status?.clusterName;

    if ( !name ) {
      return null;
    }

    const out = this.$rootGetters['rancher/byId'](NORMAN.CLUSTER, name);

    return out;
  }

  async findNormanCluster() {
    const name = this.status?.clusterName;

    if ( !name ) {
      return null;
    }

    return await this.$dispatch('rancher/find', { type: NORMAN.CLUSTER, id: name }, { root: true });
  }

  explore() {
    const location = {
      name:   'c-cluster',
      params: { cluster: this.mgmt.id }
    };

    this.currentRouter().push(location);
  }

  async goToHarvesterCluster() {
    const harvesterCluster = await this.$dispatch('create', {
      ...this,
      type: HCI.CLUSTER
    });

    try {
      await harvesterCluster.goToCluster();
    } catch {
    }
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

  get canDelete() {
    return super.canDelete && this.stateObj?.name !== 'removing';
  }

  get canEditYaml() {
    if (!this.isRke2) {
      return false;
    }

    return super.canEditYaml;
  }

  get isHostedKubernetesProvider() {
    const providers = ['AKS', 'EKS', 'GKE'];

    return providers.includes(this.provisioner);
  }

  get isPrivateHostedProvider() {
    if (this.isHostedKubernetesProvider && this.mgmt && this.provisioner) {
      switch (this.provisioner.toLowerCase()) {
      case 'gke':
        return this.mgmt.spec?.gkeConfig?.privateClusterConfig?.enablePrivateEndpoint;
      case 'eks':
        return this.mgmt.spec?.eksConfig?.privateAccess;
      case 'aks':
        return this.mgmt.spec?.aksConfig?.privateCluster;
      }
    }

    return false;
  }

  get isLocal() {
    return this.mgmt?.isLocal;
  }

  // Is the cluster a legacy (unsupported) KEV1 cluster?
  get isKev1() {
    return KEV1.includes(this.mgmt?.spec?.genericEngineConfig?.driverName);
  }

  get isImported() {
    if (this.isLocal) {
      return false;
    }

    // imported rke2 and k3s have status.driver === rke2 and k3s respectively
    // Provisioned rke2 and k3s have status.driver === imported
    if (this.mgmt?.status?.provider === 'k3s' || this.mgmt?.status?.provider === 'rke2') {
      return this.mgmt?.status?.driver === this.mgmt?.status?.provider;
    }

    // imported KEv2
    // we can't rely on this.provisioner to determine imported-ness for these clusters, as it will return 'aks' 'eks' 'gke' for both provisioned and imported clusters
    const kontainerConfigs = ['aksConfig', 'eksConfig', 'gkeConfig'];

    const isImportedKontainer = kontainerConfigs.filter((key) => {
      return this.mgmt?.spec?.[key]?.imported === true;
    }).length;

    if (isImportedKontainer) {
      return true;
    }

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

  get confirmRemove() {
    return true;
  }

  get isImportedK3s() {
    return this.isImported && this.isK3s;
  }

  get isImportedRke2() {
    return this.isImported && this.mgmt?.status?.provider?.startsWith('rke2');
  }

  get isK3s() {
    return this.mgmt?.status ? this.mgmt?.status.provider === 'k3s' : (this.spec?.kubernetesVersion || '').includes('k3s') ;
  }

  get isRke2() {
    return !!this.spec?.rkeConfig;
  }

  get isRke1() {
    // rancherKubernetesEngineConfig is not defined on imported RKE1 clusters
    return !!this.mgmt?.spec?.rancherKubernetesEngineConfig || this.mgmt?.labels['provider.cattle.io'] === 'rke';
  }

  get isHarvester() {
    return !!this.mgmt?.isHarvester;
  }

  get mgmtClusterId() {
    return this.status?.clusterName;
  }

  get mgmt() {
    return this.$rootGetters['management/byId'](MANAGEMENT.CLUSTER, this.mgmtClusterId);
  }

  get isReady() {
    return !!this.mgmt?.isReady;
  }

  // nodeGroups can be undefined for an EKS cluster that has just been created and has not
  // had any node groups added to it
  get eksNodeGroups() {
    return this.mgmt?.spec?.eksConfig?.nodeGroups || [];
  }

  waitForProvisioner(timeout, interval) {
    return this.waitForTestFn(() => {
      return !!this.provisioner;
    }, `set provisioner`, timeout, interval);
  }

  waitForMgmt(timeout = 60000, interval) {
    return this.waitForTestFn(() => {
      // `this` instance isn't getting updated with `status.clusterName`
      // Workaround - Get fresh copy from the store
      const pCluster = this.$rootGetters['management/byId'](CAPI.RANCHER_CLUSTER, this.id);
      const name = this.status?.clusterName || pCluster?.status?.clusterName;

      return name && !!this.$rootGetters['management/byId'](MANAGEMENT.CLUSTER, name);
    }, this.$rootGetters['i18n/t']('cluster.managementTimeout'), timeout, interval);
  }

  get provisioner() {
    if ( this.isRke2 ) {
      const allKeys = Object.keys(this.spec);
      const configKey = allKeys.find( (k) => k.endsWith('Config'));

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
    // Allow a model extension to override the display of the provisioner
    if (this.customProvisionerHelper?.provisionerDisplay) {
      return this.customProvisionerHelper?.provisionerDisplay(this);
    }

    let provisioner = (this.provisioner || '').toLowerCase();

    // RKE provisioner can actually do K3s too...
    if ( provisioner === 'rke2' && this.spec?.kubernetesVersion?.includes('k3s') ) {
      provisioner = 'k3s';
    } else if ( this.isImportedK3s ) {
      provisioner = 'k3s';
    } else if ( this.isImportedRke2 ) {
      provisioner = 'rke2';
    } else if ((this.isImported || this.isLocal) && this.isRke1) {
      provisioner = 'rke';
    }

    return this.$rootGetters['i18n/withFallback'](`cluster.provider."${ provisioner }"`, null, ucFirst(provisioner));
  }

  get providerLogo() {
    return this.mgmt?.providerLogo;
  }

  get nodesArchitecture() {
    const obj = {};

    this.nodes?.forEach((node) => {
      if (!node.metadata?.state?.transitioning) {
        const architecture = node.status?.nodeLabels?.[NODE_ARCHITECTURE];

        const key = architecture || this.t('cluster.architecture.label.unknown');

        obj[key] = (obj[key] || 0) + 1;
      }
    });

    return obj;
  }

  get architecture() {
    const keys = Object.keys(this.nodesArchitecture);

    switch (keys.length) {
    case 0:
      return { label: this.t('generic.provisioning') };
    case 1:
      return { label: keys[0] };
    default:
      return {
        label:   this.t('cluster.architecture.label.mixed'),
        tooltip: keys.reduce((acc, k) => `${ acc }${ k }: ${ this.nodesArchitecture[k] }<br>`, '')
      };
    }
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
    // First check annotation - useful for clusters created by extension providers
    const fromAnnotation = this.annotations?.[CAPI_ANNOTATIONS.UI_CUSTOM_PROVIDER];

    if (fromAnnotation) {
      return fromAnnotation;
    }

    if (this.isHarvester) {
      return HARVESTER;
    } else if ( this.isImported ) {
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
    if (this.customProvisionerHelper?.machineProviderDisplay) {
      return this.customProvisionerHelper?.machineProviderDisplay(this);
    }

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

  get machinePoolDefaults() {
    return this.spec.rkeConfig?.machinePoolDefaults;
  }

  set defaultHostnameLengthLimit(value) {
    this.spec.rkeConfig = this.spec.rkeConfig || {};
    this.spec.rkeConfig.machinePoolDefaults = this.spec.rkeConfig.machinePoolDefaults || {};
    this.spec.rkeConfig.machinePoolDefaults.hostnameLengthLimit = value;
  }

  get defaultHostnameLengthLimit() {
    return this.spec.rkeConfig?.machinePoolDefaults?.hostnameLengthLimit;
  }

  removeDefaultHostnameLengthLimit() {
    if (this.machinePoolDefaults?.hostnameLengthLimit) {
      delete this.spec.rkeConfig.machinePoolDefaults.hostnameLengthLimit;

      if (Object.keys(this.spec?.rkeConfig?.machinePoolDefaults).length === 0) {
        delete this.spec.rkeConfig.machinePoolDefaults;
      }
    }
  }

  get nodes() {
    return this.$rootGetters['management/all'](MANAGEMENT.NODE).filter((node) => node.id.startsWith(this.mgmtClusterId));
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
    const deployments = this.$rootGetters['management/all'](CAPI.MACHINE_DEPLOYMENT).filter((pool) => pool.spec?.clusterName === this.metadata.name);

    if (!!deployments.length) {
      return deployments;
    }

    return this.$rootGetters['management/all'](MANAGEMENT.NODE_POOL).filter((pool) => pool.spec.clusterName === this.status?.clusterName);
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

  get unavailableMachines() {
    if (this.isReady) {
      if (this.isRke1) {
        const names = this.nodes.filter((node) => {
          return node.status.conditions.find((c) => c.error && c.type === 'Ready');
        }).map((node) => {
          const name = node.status.nodeName || node.metadata.name;

          return this.t('cluster.availabilityWarnings.node', { name });
        });

        return names.join('<br>');
      } else {
        const names = this.machines.filter((machine) => {
          return machine.status?.conditions?.find((c) => c.error && c.type === 'NodeHealthy');
        }).map((machine) => {
          if (machine.status?.nodeRef?.name) {
            return this.t('cluster.availabilityWarnings.node', { name: machine.status.nodeRef.name });
          }

          return this.t('cluster.availabilityWarnings.machine', { name: machine.metadata.name });
        });

        return names.join('<br>');
      }
    }

    return '';
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
    ].filter((x) => x.value > 0);

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

  async copyKubeConfig() {
    await this.mgmt?.copyKubeConfig();

    this.$dispatch('growl/success', {
      title:   this.t('cluster.copiedConfig'),
      timeout: 3000,
    }, { root: true });
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

    const successful = res.filter( (x) => x.status === 'fulfilled').length;

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
        url:    `/v3/clusters/${ escape(this.mgmt.id) }?action=backupEtcd`,
        method: 'post',
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
      .filter((s) => s.metadata.namespace === this.namespace && s.clusterName === this.name );
  }

  restoreSnapshotAction(resource = this) {
    this.$dispatch('promptRestore', [resource]);
  }

  saveAsRKETemplate(cluster = this) {
    this.$dispatch('promptModal', {
      componentProps: { cluster },
      component:      'SaveAsRKETemplateDialog'
    });
  }

  rotateCertificates(cluster = this) {
    this.$dispatch('promptModal', {
      componentProps: { cluster },

      component: 'RotateCertificatesDialog'
    });
  }

  rotateEncryptionKey(cluster = this) {
    this.$dispatch('promptModal', {
      componentProps: { cluster },
      component:      'RotateEncryptionKeyDialog'
    });
  }

  get stateObj() {
    return this._stateObj;
  }

  get rkeTemplate() {
    if (!this.isRke1 || !this.mgmt) {
      // Not an RKE! cluster or no management cluster available
      return false;
    }

    if (!this.mgmt.spec?.clusterTemplateRevisionName) {
      // Cluster does not use an RKE template
      return false;
    }

    const clusterTemplateName = this.mgmt.spec.clusterTemplateName.replace(':', '/');
    const clusterTemplateRevisionName = this.mgmt.spec.clusterTemplateRevisionName.replace(':', '/');
    const template = this.$rootGetters['management/all'](MANAGEMENT.RKE_TEMPLATE).find((t) => t.id === clusterTemplateName);
    const revision = this.$rootGetters['management/all'](MANAGEMENT.RKE_TEMPLATE_REVISION).find((t) => t.spec.enabled && t.id === clusterTemplateRevisionName);

    if (!template || !revision) {
      return false;
    }

    return {
      displayName: `${ template.spec?.displayName }/${ revision.spec?.displayName }`,
      upgrade:     this.rkeTemplateUpgrade,
      template,
      revision,
    };
  }

  get rkeTemplateUpgrade() {
    if (!this.isRke1 || !this.mgmt) {
      // Not an RKE! cluster or no management cluster available
      return false;
    }

    if (!this.mgmt.spec?.clusterTemplateRevisionName) {
      // Cluster does not use an RKE template
      return false;
    }

    const clusterTemplateRevisionName = this.mgmt.spec.clusterTemplateRevisionName.replace(':', '/');

    // Get all of the template revisions for this template
    const revisions = this.$rootGetters['management/all'](MANAGEMENT.RKE_TEMPLATE_REVISION).filter((t) => t.spec.enabled && t.spec.clusterTemplateName === this.mgmt.spec.clusterTemplateName);

    if (revisions.length <= 1) {
      // Only one template revision
      return false;
    }

    revisions.sort((a, b) => {
      return parseInt(a.metadata.resourceVersion, 10) - parseInt(b.metadata.resourceVersion, 10);
    }).reverse();

    return revisions[0].id !== clusterTemplateRevisionName ? revisions[0].spec?.displayName : false;
  }

  get _stateObj() {
    if (!this.isRke2) {
      return this.mgmt?.stateObj || this.metadata?.state;
    }

    return this.metadata?.state;
  }

  get supportsWindows() {
    if (this.isK3s || this.isImportedK3s) {
      return false;
    }

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
        maxLength:      63,
      },
    ];
  }

  get agentConfig() {
    // The one we want is the first one with no selector.
    // If there are multiple with no selector, that will fall under the unsupported message below.
    return this.spec.rkeConfig?.machineSelectorConfig
      ?.find((x) => !x.machineLabelSelector)?.config || { };
  }

  get cloudProvider() {
    return this.agentConfig?.['cloud-provider-name'];
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
            url:    `/k8s/clusters/${ harvesterClusterId }/v1/harvester/serviceaccounts/${ poolConfig.vmNamespace }/${ this.metadata.name }`,
            method: 'DELETE',
          }, { root: true });
        } catch (e) {
          console.error(e); // eslint-disable-line no-console
        }
      }
    }

    if ( res?._status === 204 ) {
      await this.$dispatch('ws.resource.remove', { data: this });
    }

    // If this cluster has a custom provisioner, allow it to do custom deletion
    if (this.customProvisionerHelper?.postDelete) {
      return this.customProvisionerHelper?.postDelete(this);
    }
  }

  /**
   * Get the custom provisioner helper for this model
   */
  get customProvisionerHelper() {
    // Find the first model extension that says it can be used for this model
    return this.modelExtensions.find((modelExt) => modelExt.useFor ? modelExt.useFor(this) : false);
  }

  get groupByParent() {
    // Customer helper can report if the cluster has a parent cluster
    return this.customProvisionerHelper?.parentCluster?.(this) || this.t('resourceTable.groupLabel.notInACluster');
  }

  get hasError() {
    // Before we were just checking for this.status?.conditions?.some((condition) => condition.error === true)
    // but this is wrong as an error might exist but it might not be meaningful in the context of readiness of a cluster
    // which is what this 'hasError' is used for.
    // We now check if there's a ready condition after an error, which helps dictate the readiness of a cluster
    // Based on the findings in https://github.com/rancher/dashboard/issues/10043
    if (this.status?.conditions && this.status?.conditions.length) {
      // if there are errors, we compare with how recent the "Ready" condition is compared to that error, otherwise we just move on
      if (this.status?.conditions.some((c) => c.error === true)) {
        // there's no ready condition and has an error, mark it
        if (!this.status?.conditions.some((c) => c.type === 'Ready')) {
          return true;
        }

        const filteredConditions = this.status?.conditions.filter((c) => c.error === true || c.type === 'Ready');
        const mostRecentCondition = filteredConditions.reduce((a, b) => ((a.lastUpdateTime > b.lastUpdateTime) ? a : b));

        return mostRecentCondition.error;
      }
    }

    return false;
  }

  get namespaceLocation() {
    const localCluster = this.$rootGetters['management/byId'](MANAGEMENT.CLUSTER, LOCAL_CLUSTER);

    if (localCluster) {
      return {
        name:   'c-cluster-product-resource-id',
        params: {
          cluster:  localCluster.id,
          product:  this.$rootGetters['productId'],
          resource: NAMESPACE,
          id:       this.namespace
        }
      };
    }

    return null;
  }

  // JSON Paths that should be folded in the YAML editor by default
  get yamlFolding() {
    return [
      'spec.rkeConfig.machinePools.dynamicSchemaSpec',
    ];
  }

  get description() {
    return super.description || this.mgmt?.description;
  }

  renew() {
    return this.cloudCredential?.renew();
  }

  renewBulk(clusters = []) {
    // In theory we don't need to filter by cloudCred, but do so for safety
    const cloudCredentials = clusters.filter((c) => c.cloudCredential).map((c) => c.cloudCredential);

    return this.cloudCredential?.renewBulk(cloudCredentials);
  }

  get cloudCredential() {
    return this.$rootGetters['rancher/all'](NORMAN.CLOUD_CREDENTIAL).find((cc) => cc.id === this.spec.cloudCredentialSecretName);
  }

  get cloudCredentialWarning() {
    const expireData = this.cloudCredential?.expireData;

    return expireData?.expired || expireData?.expiring;
  }
}
