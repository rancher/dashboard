import { CATALOG, CLUSTER_BADGE, NODE_ARCHITECTURE } from '@shell/config/labels-annotations';
import {
  NODE, FLEET, MANAGEMENT, CAPI, EXT,
  NORMAN,
  HCI
} from '@shell/config/types';
import { insertAt, addObject, removeObject, sameContents } from '@shell/utils/array';
import { downloadFile } from '@shell/utils/download';
import { parseSi } from '@shell/utils/units';
import { parseColor, textColor } from '@shell/utils/color';
import { isEmpty } from '@shell/utils/object';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/features';
import { isHarvesterCluster } from '@shell/utils/cluster';
import SteveModel from '@shell/plugins/steve/steve-class';
import { LINUX, WINDOWS } from '@shell/store/catalog';
import { KEV1 } from './management.cattle.io.kontainerdriver';
import { requireAsset } from '@shell/utils/require-asset';
import { PINNED_CLUSTERS } from '@shell/store/prefs';
import { copyTextToClipboard } from '@shell/utils/clipboard';
import { isHostedProvider } from '@shell/utils/provider';
import { ucFirst } from '@shell/utils/string';
import { sortBy } from '@shell/utils/sort';

const DEFAULT_BADGE_COLOR = '#707070';

// See translation file cluster.providers for list of providers
// If the logo is not named with the provider name, add an override here
const PROVIDER_LOGO_OVERRIDE = {};

function findRelationship(verb, type, relationships = []) {
  const from = `${ verb }Type`;
  const id = `${ verb }Id`;

  return relationships.find((r) => r[from] === type)?.[id];
}

export default class MgmtCluster extends SteveModel {
  get details() {
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
  }

  get canCreateKubeconfig() {
    const schema = this.$rootGetters['management/schemaFor'](EXT.KUBECONFIG);

    return (schema?.collectionMethods || []).includes('POST');
  }

  get availableActions() {
    // If on the Cluster Management Cluster List use the provisioning cluster actions instead of the management cluster
    // This resolution feels a bit hacky, however the alternative would be to create a table prop and lots of weird plumbing
    // It's a small use case, so just doing a limited solution
    const listLocation = this.provCluster?.listLocation;
    const currentRoute = this.currentRoute();

    const isClusterManagementListPage = listLocation?.name === currentRoute?.name && sameContents(listLocation.params, currentRoute.params);

    if (isClusterManagementListPage) {
      return this.provCluster?.availableActions.map((action) => ({
        ...action,
        altResource: this.provCluster, // actions work by using the row's resource with the function name. this overrides that
      }));
    }

    return super.availableActions;
  }

  get _availableActions() {
    const out = super._availableActions;

    insertAt(out, 0, {
      action:  'openShell',
      label:   this.t('nav.shell'),
      icon:    'icon icon-terminal',
      enabled: !!this.links.shell,
    });

    insertAt(out, 1, {
      action:     'downloadKubeConfig',
      bulkAction: 'downloadKubeConfigBulk',
      label:      this.t('nav.kubeconfig.download'),
      icon:       'icon icon-download',
      bulkable:   true,
      enabled:    this.$rootGetters['isRancher'] && this.canCreateKubeconfig,
    });

    insertAt(out, 2, {
      action:   'copyKubeConfig',
      label:    this.t('cluster.copyConfig'),
      bulkable: false,
      enabled:  this.$rootGetters['isRancher'] && this.canCreateKubeconfig,
      icon:     'icon icon-copy',
    });

    return out;
  }

  get canDelete() {
    return this.hasLink('remove') && !this?.spec?.internal;
  }

  get machinePools() {
    const pools = this.$getters['all'](MANAGEMENT.NODE_POOL);

    return pools.filter((x) => x.spec?.clusterName === this.id);
  }

  get provisioner() {
    // For imported K3s clusters, this.status.driver is 'k3s.'
    if (this.status?.driver) {
      return this.status.driver;
    }

    // Sometimes the driver will be empty (like unconnected custom rke2 clusters), so fall back on the new and improved status.provider
    if (this.status?.provider) {
      return this.status.provider;
    }

    return 'imported';
  }

  get provisionerDisplay() {
    // Allow a model extension to override the display of the provisioner
    if (this.customProvisionerHelper?.provisionerDisplay) {
      return this.customProvisionerHelper?.provisionerDisplay(this);
    }

    let provisioner = this.provisioner?.toLowerCase();

    if (provisioner === 'rke.windows') {
      provisioner = 'rkeWindows';
    }

    if (!this.$rootGetters['i18n/exists'](`cluster.provider.${ provisioner }`)) {
      provisioner = 'other';
    }

    return this.$rootGetters['i18n/withFallback'](`cluster.provider."${ provisioner }"`, null, ucFirst(this.provisioner));
  }

  /**
   * Get the custom provisioner helper for this model
   */
  get customProvisionerHelper() {
    if (this.provCluster) {
      return null;
    }

    // Find the first model extension that says it can be used for this model
    return this.modelExtensions.find((modelExt) => modelExt.useFor ? modelExt.useFor(this.provCluster) : false);
  }

  get provider() {
    return this.status?.provider;
  }

  get machineProvider() {
    return this.status?.info.machineProvider;
  }

  get machineProviderDisplay() {
    if (this.customProvisionerHelper?.machineProviderDisplay) {
      return this.customProvisionerHelper?.machineProviderDisplay(this);
    }

    const provider = (this.machineProvider || '').toLowerCase();

    if ( provider ) {
      return this.$rootGetters['i18n/withFallback'](`cluster.provider."${ provider }"`, null, provider);
    } else {
      return this.$rootGetters['i18n/t']('generic.unknown');
    }
  }

  // Is the cluster a legacy (unsupported) KEV1 cluster?
  get isKev1() {
    return KEV1.includes(this.spec?.genericEngineConfig?.driverName);
  }

  get isImported() {
    const provider = this.status?.provider;
    const driver = this.status?.driver;

    // The main case
    if (provider === 'k3s' || provider === 'rke2') {
      return driver === provider;
    }
    // The 'waiting' case
    if (!provider && (driver === 'k3s' || driver === 'rke2')) {
      return true;
    }

    // imported KEv2
    // we can't rely on this.provisioner to determine imported-ness for these clusters, as it will return 'aks' 'eks' 'gke' for both provisioned and imported clusters
    if (this.isHostedKubernetesProvider && !!this.provCluster?.providerConfig.imported) {
      return true;
    }

    return this.provisioner === 'imported';
  }

  get isCustom() {
    if ( this.isRke2 ) {
      return !(this.provCluster?.spec?.rkeConfig?.machinePools?.length);
    }

    return false;
  }

  get isImportedK3s() {
    return this.isImported && this.isK3s;
  }

  get isImportedRke2() {
    return this.isImported && this.provider?.startsWith('rke2');
  }

  get isK3s() {
    return this.status ? this.status.provider === 'k3s' : (this.kubernetesVersion || '').includes('k3s') ;
  }

  get isRke2() {
    return !!this.provCluster?.spec?.rkeConfig;
  }

  // identify v2 provisioning clusters created using upstream capi infrastructure providers instead of rancher/machine
  get isCapiHybrid() {
    if (!this.isRke2) {
      return false;
    }

    const machineReferences = (this.provCluster.spec?.rkeConfig?.machinePools || []).map((pool) => pool.machineConfigRef);

    const capiMachines = machineReferences.find((r) => r?.apiVersion?.includes('cluster.x-k8s.io'));

    return !!capiMachines;
  }

  get isHostedKubernetesProvider() {
    const context = {
      dispatch:   this.$dispatch,
      getters:    this.$getters,
      axios:      this.$axios,
      $extension: this.$extension,
      t:          (...args) => this.t.apply(this, args),
    };

    return isHostedProvider(context, this.provisioner);
  }

  get isPrivateHostedProvider() {
    if (this.isHostedKubernetesProvider && this.provisioner) {
      switch (this.provisioner.toLowerCase()) {
      case 'gke':
        return this.spec?.gkeConfig?.privateClusterConfig?.enablePrivateEndpoint;
      case 'eks':
        return this.spec?.eksConfig?.privateAccess;
      case 'aks':
        return this.spec?.aksConfig?.privateCluster;
      }
    }

    return false;
  }

  get groupByLabel() {
    return `Workspace: ${ this.spec.fleetWorkspaceName }`;
  }

  get isReady() {
    // If the Connected condition exists, use that (2.6+)
    if ( this.hasCondition('Connected') ) {
      return this.isCondition('Connected');
    }

    // Otherwise use Ready (older)
    return this.isCondition('Ready');
  }

  get config() {
    if (!this.spec?.[`${ this.provisioner }Config`]) {
      const allKeys = Object.keys(this.spec);
      const configKey = allKeys.find( (k) => k.endsWith('Config'));

      return this.spec[configKey];
    }

    return this.spec?.[`${ this.provisioner }Config`];
  }

  get kubernetesVersionRaw() {
    return this.statusInfo.kubernetesVersion;
  }

  get kubernetesVersion() {
    return this.kubernetesVersionRaw || this.$rootGetters['i18n/t']('generic.provisioning');
  }

  get kubernetesVersionBase() {
    return this.kubernetesVersion.replace(/[+-].*$/, '');
  }

  get kubernetesVersionExtension() {
    if ( this.kubernetesVersion.match(/[+-]/) ) {
      return this.kubernetesVersion.replace(/^.*([+-])/, '$1');
    }

    return '';
  }

  get providerOs() {
    if ( this.provider?.endsWith('.windows')) {
      return 'windows';
    }

    return 'linux';
  }

  get providerOsLogo() {
    return requireAsset(`~shell/assets/images/vendor/${ this.providerOs }.svg`);
  }

  get workerOSs() {
    // rke1 clusters have windows support defined on create
    // rke2 clusters report linux workers in mgmt cluster status
    const rke2WindowsWorkers = this.status?.windowsWorkerCount;
    const rke2LinuxWorkers = this.status?.linuxWorkerCount;

    if (rke2WindowsWorkers || rke2LinuxWorkers ) {
      const out = [];

      if (rke2WindowsWorkers) {
        out.push(WINDOWS);
      }
      if (rke2LinuxWorkers) {
        out.push(LINUX);
      }

      return out;
    } else if (this.providerOs === WINDOWS) {
      return [WINDOWS];
    }

    return [LINUX];
  }

  get isLocal() {
    return this.spec?.internal === true;
  }

  get isHarvester() {
    return isHarvesterCluster(this);
  }

  get providerLogo() {
    let provider = this.provider || 'kubernetes';

    if (this.isHarvester) {
      provider = HARVESTER;
    }
    // Only interested in the part before the period
    const prv = provider.split('.')[0];
    // Allow overrides if needed
    const logo = PROVIDER_LOGO_OVERRIDE[prv] || prv;

    let icon;

    try {
      icon = requireAsset(`~shell/assets/images/providers/${ prv }.svg`);
    } catch (e) {
      console.warn(`Can not find provider logo for provider ${ logo }`); // eslint-disable-line no-console
      // Use fallback generic Kubernetes icon
      icon = requireAsset(`~shell/assets/images/providers/kubernetes.svg`);
    }

    return icon;
  }

  get providerMenuLogo() {
    return this.providerLogo;
  }

  get providerNavLogo() {
    return this.providerLogo;
  }

  get pools() {
    const deployments = this.$rootGetters['management/all'](CAPI.MACHINE_DEPLOYMENT).filter((pool) => pool.spec?.clusterName === this.provClusterName);

    if (!!deployments.length) {
      return deployments;
    }

    return this.machinePools;
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

  get nodes() {
    return this.$getters['all'](MANAGEMENT.NODE).filter((node) => node.id.startsWith(this.id));
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
    if (!this.statusInfo.arch) {
      return { label: this.t('generic.provisioning') };
    }
    if (this.statusInfo.arch === 'mixed') {
      return { label: this.t('cluster.architecture.label.mixed') };
    }

    return { label: this.statusInfo.arch };
  }

  get machines() {
    return this.$rootGetters['management/all'](CAPI.MACHINE).filter((machine) => {
      if ( machine.metadata?.namespace !== this.provClusterNamespace ) {
        return false;
      }

      return machine.spec?.clusterName === this.provClusterName;
    });
  }

  get unavailable() {
    return this.pools.reduce((acc, pool) => acc + (pool.unavailable || 0), 0);
  }

  get unavailableMachines() {
    if (this.isReady) {
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

    return '';
  }

  // nodeGroups can be undefined for an EKS cluster that has just been created and has not
  // had any node groups added to it
  get eksNodeGroups() {
    return this.spec?.eksConfig?.nodeGroups || [];
  }

  // Color to use as the underline for the icon in the app bar
  get iconColor() {
    return this.metadata?.annotations?.[CLUSTER_BADGE.COLOR];
  }

  // Custom badge to show for the Cluster (if the appropriate annotations are set)
  get badge() {
    const icon = this.metadata?.annotations?.[CLUSTER_BADGE.ICON_TEXT];
    const comment = this.metadata?.annotations?.[CLUSTER_BADGE.TEXT];

    if (!icon && !comment) {
      return undefined;
    }

    let color = this.iconColor || DEFAULT_BADGE_COLOR;
    const iconText = this.metadata?.annotations[CLUSTER_BADGE.ICON_TEXT] || '';
    let foregroundColor;

    try {
      foregroundColor = textColor(parseColor(color.trim())); // Remove any whitespace
    } catch (_e) {
      // If we could not parse the badge color, use the defaults
      color = DEFAULT_BADGE_COLOR;
      foregroundColor = textColor(parseColor(color));
    }

    return {
      text:      comment || undefined,
      color,
      textColor: foregroundColor,
      iconText:  iconText.substr(0, 3)
    };
  }

  get scope() {
    return this.isLocal ? CATALOG._MANAGEMENT : CATALOG._DOWNSTREAM;
  }

  setClusterNameLabel(andSave) {
    if ( this.ownerReferences?.length || this.metadata?.labels?.[FLEET.CLUSTER_NAME] === this.id ) {
      return;
    }

    this.metadata = this.metadata || {};
    this.metadata.labels = this.metadata.labels || {};
    this.metadata.labels[FLEET.CLUSTER_NAME] = this.id;

    if ( andSave ) {
      return this.save();
    }
  }

  get availableCpu() {
    const reserved = parseSi(this.status?.requested?.cpu);
    const allocatable = parseSi(this.status?.allocatable?.cpu);

    if ( allocatable > 0 && reserved >= 0 ) {
      return Math.max(0, allocatable - reserved);
    } else {
      return null;
    }
  }

  get availableMemory() {
    const reserved = parseSi(this.status?.requested?.memory);
    const allocatable = parseSi(this.status?.allocatable?.memory);

    if ( allocatable > 0 && reserved >= 0 ) {
      return Math.max(0, allocatable - reserved);
    } else {
      return null;
    }
  }

  openShell() {
    this.$dispatch('wm/open', {
      id:        `kubectl-${ this.id }`,
      label:     this.$rootGetters['i18n/t']('wm.kubectlShell.title', { name: this.nameDisplay }),
      icon:      'terminal',
      component: 'KubectlShell',
      attrs:     {
        cluster: this,
        pod:     {}
      }
    }, { root: true });
  }

  async generateKubeConfig(clusters = [this.id]) {
    const memoryResource = await this.$dispatch('management/create', {
      type: EXT.KUBECONFIG,
      spec: { clusters }
    }, { root: true });

    const res = await memoryResource.save();

    return res.status?.value;
  }

  async downloadKubeConfig() {
    const config = await this.generateKubeConfig();

    downloadFile(`${ this.nameDisplay }.yaml`, config, 'application/yaml');
  }

  async downloadKubeConfigBulk(items) {
    const clusters = items.map((item) => item.mgmt?.id || item.id);
    const config = await this.generateKubeConfig(clusters);

    downloadFile('kubeconfig.yaml', config, 'application/yaml');
  }

  async copyKubeConfig() {
    try {
      const config = await this.generateKubeConfig();

      if (config) {
        await copyTextToClipboard(config);
      }
    } catch {}
  }

  async fetchNodeMetrics() {
    const nodes = await this.$dispatch('cluster/findAll', { type: NODE }, { root: true });
    const nodeMetrics = await this.$dispatch('cluster/findAll', { type: NODE }, { root: true });

    const someNonWorkerRoles = nodes.some((node) => node.hasARole && !node.isWorker);

    const metrics = nodeMetrics.filter((metric) => {
      const node = nodes.find((nd) => nd.id === metric.id);

      return node && (!someNonWorkerRoles || node.isWorker);
    });
    const initialAggregation = {
      cpu:    0,
      memory: 0
    };

    if (isEmpty(metrics)) {
      return null;
    }

    return metrics.reduce((agg, metric) => {
      agg.cpu += parseSi(metric?.usage?.cpu);
      agg.memory += parseSi(metric?.usage?.memory);

      return agg;
    }, initialAggregation);
  }

  get normanCluster() {
    return this.$rootGetters['rancher/byId'](NORMAN.CLUSTER, this.id);
  }

  async findNormanCluster() {
    return await this.$dispatch('rancher/find', { type: NORMAN.CLUSTER, id: this.id }, { root: true });
  }

  get provCluster() {
    return this.$rootGetters['management/byId'](CAPI.RANCHER_CLUSTER, this.provClusterId);
  }

  get provClusterId() {
    // Note - there's also status.info.provisioningClusterReg, which is a link to the lifecycle owning type
    // for v2prov this would be a provisioning.cattle.io.cluster, but for others it wouldn't be.

    const verb = this.isLocal || this.isHostedKubernetesProvider ? 'to' : 'from';
    const res = findRelationship(verb, CAPI.RANCHER_CLUSTER, this.metadata?.relationships);

    if (res) {
      return res;
    }

    return findRelationship(verb === 'to' ? 'from' : 'to', CAPI.RANCHER_CLUSTER, this.metadata?.relationships);
  }

  get provClusterNamespace() {
    // Could consider using `metadata.annotations."objectset.rio.cattle.io/owner-namespace"` instead of provClusterId from resource rels
    const [namespace] = this.provClusterId.split('/');

    return namespace;
  }

  get provClusterName() {
    // Could consider using `metadata.annotations."objectset.rio.cattle.io/owner-name"` instead of provClusterId from resource rels
    const [, name] = this.provClusterId.split('/');

    return name;
  }

  get pinned() {
    return this.$rootGetters['prefs/get'](PINNED_CLUSTERS).includes(this.id);
  }

  pin() {
    const types = this.$rootGetters['prefs/get'](PINNED_CLUSTERS) || [];

    addObject(types, this.id);

    this.$dispatch('prefs/set', { key: PINNED_CLUSTERS, value: types }, { root: true });
  }

  unpin() {
    const types = this.$rootGetters['prefs/get'](PINNED_CLUSTERS) || [];

    removeObject(types, this.id);

    this.$dispatch('prefs/set', { key: PINNED_CLUSTERS, value: types }, { root: true });
  }

  get canExplore() {
    return this.isReady && !this.hasError;
  }

  get hasError() {
    // TODO: kinara - this was copied over from prov cluster. prov conditions vs mgmt conditions
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

  get isAutoscalerEnabled() {
    if (!this.provCluster) {
      return false;
    }

    return !!this.provCluster.spec?.rkeConfig?.machinePools?.some((pool) => {
      return typeof pool.autoscalingMinSize !== 'undefined' || typeof pool.autoscalingMaxSize !== 'undefined';
    });
  }

  _statusInfoWarned = false;
  get statusInfo() {
    if (!this.status.info) {
      if (!this._statusInfoWarned) {
        this._statusInfoWarned = true;
        // eslint-disable-next-line no-console
        console.warn(`management.cattle.io.cluster '${ this.id }' is missing 'status.info'. This could mean the resource is troubled, or an extension has brought in this new model which is used in an older rancher`);
      }

      return { };
    }

    return this.status.info;
  }

  async goToHarvesterCluster() {
    const harvesterCluster = await this.$dispatch('create', {
      ...this.provCluster,
      type: HCI.CLUSTER
    });

    try {
      await harvesterCluster.goToCluster();
    } catch {
    }
  }
}
