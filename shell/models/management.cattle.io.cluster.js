import Vue from 'vue';
import { CATALOG, CLUSTER_BADGE } from '@shell/config/labels-annotations';
import { NODE, FLEET, MANAGEMENT } from '@shell/config/types';
import { insertAt } from '@shell/utils/array';
import { downloadFile } from '@shell/utils/download';
import { parseSi } from '@shell/utils/units';
import { parseColor, textColor } from '@shell/utils/color';
import jsyaml from 'js-yaml';
import { eachLimit } from '@shell/utils/promise';
import { addParams } from '@shell/utils/url';
import { isEmpty } from '@shell/utils/object';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/product/harvester-manager';
import { isHarvesterCluster } from '@shell/utils/cluster';
import HybridModel from '@shell/plugins/steve/hybrid-class';
import { LINUX, WINDOWS } from '@shell/store/catalog';
import { KONTAINER_TO_DRIVER } from './management.cattle.io.kontainerdriver';

// See translation file cluster.providers for list of providers
// If the logo is not named with the provider name, add an override here
const PROVIDER_LOGO_OVERRIDE = {};

export default class MgmtCluster extends HybridModel {
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

  get _availableActions() {
    const out = super._availableActions;

    insertAt(out, 0, {
      action:     'openShell',
      label:      this.t('nav.shell'),
      icon:       'icon icon-terminal',
      enabled:    !!this.links.shell,
    });

    insertAt(out, 1, {
      action:     'downloadKubeConfig',
      bulkAction: 'downloadKubeConfigBulk',
      label:      this.t('nav.kubeconfig.download'),
      icon:       'icon icon-download',
      bulkable:   true,
      enabled:    this.$rootGetters['isRancher'] && this.hasAction('generateKubeconfig'),
    });

    insertAt(out, 2, {
      action:     'copyKubeConfig',
      label:      this.t('cluster.copyConfig'),
      bulkable:   false,
      enabled:    this.$rootGetters['isRancher'] && this.hasAction('generateKubeconfig'),
      icon:       'icon icon-copy',
    });

    return out;
  }

  get canDelete() {
    return this.hasLink('remove') && !this?.spec?.internal;
  }

  get machinePools() {
    const pools = this.$getters['all'](MANAGEMENT.NODE_POOL);

    return pools.filter(x => x.spec?.clusterName === this.id);
  }

  get provisioner() {
    // For imported K3s clusters, this.status.driver is 'k3s.'
    return this.status?.driver ? this.status.driver : 'imported';
  }

  get machineProvider() {
    const kind = this.machinePools?.[0]?.provider;

    if ( kind ) {
      return kind.replace(/config$/i, '').toLowerCase();
    } else if ( this.spec?.internal ) {
      return 'local';
    }

    return null;
  }

  get rkeTemplateVersion() {
    return this.spec?.clusterTemplateRevisionName;
  }

  get providerForEmberParam() {
    // Ember wants one word called provider to tell what component to show, but has much indirect mapping to figure out what it is.
    let provider;
    // Provisioner is the "<something>Config" in the model
    const provisioner = KONTAINER_TO_DRIVER[(this.provisioner || '').toLowerCase()] || this.provisioner;

    if ( provisioner === 'rancherKubernetesEngine' ) {
      // Look for a cloud provider in one of the node templates
      if ( this.machinePools?.[0] ) {
        provider = this.machinePools[0]?.nodeTemplate?.spec?.driver || null;
      } else {
        provider = 'custom';
      }
    } else if ( this.driver ) {
      provider = this.driver;
    } else if ( provisioner && provisioner.endsWith('v2') ) {
      provider = provisioner;
    } else {
      provider = 'import';
    }

    return provider;
  }

  get emberEditPath() {
    let clusterTemplateRevision;

    // If the RKE1 cluster is created from an RKE template, we need
    // to get the template version to pass into the Ember UI for
    // the iFramed edit cluster form
    if (this.rkeTemplateVersion) {
      clusterTemplateRevision = this.rkeTemplateVersion;
    }
    const provider = this.providerForEmberParam;

    // Avoid passing falsy values as query parameters
    const qp = { };

    if (provider) {
      qp['provider'] = provider;
    }

    if (clusterTemplateRevision) {
      qp['clusterTemplateRevision'] = clusterTemplateRevision;
    }

    // Copied out of https://github.com/rancher/ui/blob/20f56dc54c4fc09b5f911e533cb751c13609adaf/app/models/cluster.js#L844
    if ( provider === 'import' && isEmpty(this.eksConfig) && isEmpty(this.gkeConfig) ) {
      qp.importProvider = 'other';
    } else if (
      (provider === 'amazoneks' && !isEmpty(this.eksConfig) ) ||
       (provider === 'gke' && !isEmpty(this.gkeConfig) )
       // || something for aks v2
    ) {
      qp.importProvider = KONTAINER_TO_DRIVER[provider];
    }

    if ( this.clusterTemplateRevisionId ) {
      qp.clusterTemplateRevision = this.clusterTemplateRevisionId;
    }

    const path = addParams(`/c/${ escape(this.id) }/edit`, qp);

    return path;
  }

  get groupByLabel() {
    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAWorkspace');
  }

  get isReady() {
    // If the Connected condition exists, use that (2.6+)
    if ( this.hasCondition('Connected') ) {
      return this.isCondition('Connected');
    }

    // Otherwise use Ready (older)
    return this.isCondition('Ready');
  }

  get kubernetesVersionRaw() {
    const fromStatus = this.status?.version?.gitVersion;
    const fromSpec = this.spec?.[`${ this.provisioner }Config`]?.kubernetesVersion;

    return fromStatus || fromSpec;
  }

  get kubernetesVersion() {
    return this.kubernetesVersionRaw || this.$rootGetters['i18n/t']('generic.provisioning');
  }

  get kubernetesVersionBase() {
    return this.kubernetesVersion.replace(/[+-].*$/, '');
  }

  get kubernetesVersionExtension() {
    if ( this.kubernetesVersion.match(/[+-]]/) ) {
      return this.kubernetesVersion.replace(/^.*([+-])/, '$1');
    }

    return '';
  }

  get providerOs() {
    if ( this.status?.provider.endsWith('.windows')) {
      return 'windows';
    }

    return 'linux';
  }

  get providerOsLogo() {
    return require(`~shell/assets/images/vendor/${ this.providerOs }.svg`);
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
    const provider = this.status?.provider || 'kubernetes';
    // Only interested in the part before the period
    const prv = provider.split('.')[0];
    // Allow overrides if needed
    const logo = PROVIDER_LOGO_OVERRIDE[prv] || prv;

    let icon;

    try {
      icon = require(`~shell/assets/images/providers/${ prv }.svg`);
    } catch (e) {
      console.warn(`Can not find provider logo for provider ${ logo }`); // eslint-disable-line no-console
      // Use fallback generic Kubernetes icon
      icon = require(`~shell/assets/images/providers/kubernetes.svg`);
    }

    return icon;
  }

  get providerMenuLogo() {
    if (this?.status?.provider === HARVESTER) {
      return require(`~shell/assets/images/providers/kubernetes.svg`);
    }

    return this.providerLogo;
  }

  get providerNavLogo() {
    if (this?.status?.provider === HARVESTER && this.$rootGetters['currentProduct'].inStore !== HARVESTER) {
      return require(`~shell/assets/images/providers/kubernetes.svg`);
    }

    return this.providerLogo;
  }

  // Custom badge to show for the Cluster (if the appropriate annotations are set)
  get badge() {
    const text = this.metadata?.annotations?.[CLUSTER_BADGE.TEXT];

    if (!text) {
      return undefined;
    }

    const color = this.metadata?.annotations[CLUSTER_BADGE.COLOR] || '#7f7f7f';
    const iconText = this.metadata?.annotations[CLUSTER_BADGE.ICON_TEXT] || '';

    return {
      text,
      color,
      textColor: textColor(parseColor(color)),
      iconText:  iconText.substr(0, 2)
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
    const reserved = parseSi(this.status.requested?.cpu);
    const allocatable = parseSi(this.status.allocatable?.cpu);

    if ( allocatable > 0 && reserved >= 0 ) {
      return Math.max(0, allocatable - reserved);
    } else {
      return null;
    }
  }

  get availableMemory() {
    const reserved = parseSi(this.status.requested?.memory);
    const allocatable = parseSi(this.status.allocatable?.memory);

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

  async generateKubeConfig() {
    const res = await this.doAction('generateKubeconfig');

    return res.config;
  }

  async downloadKubeConfig() {
    const config = await this.generateKubeConfig();

    downloadFile(`${ this.nameDisplay }.yaml`, config, 'application/yaml');
  }

  async downloadKubeConfigBulk(items) {
    let obj = {};
    let first = true;

    await eachLimit(items, 10, (item, idx) => {
      return item.generateKubeConfig().then((config) => {
        const entry = jsyaml.load(config);

        if ( first ) {
          obj = entry;
          first = false;
        } else {
          obj.clusters.push(...entry.clusters);
          obj.users.push(...entry.users);
          obj.contexts.push(...entry.contexts);
        }
      });
    });

    delete obj['current-context'];

    const out = jsyaml.dump(obj);

    downloadFile('kubeconfig.yaml', out, 'application/yaml');
  }

  async copyKubeConfig() {
    const config = await this.generateKubeConfig();

    Vue.prototype.$copyText(config);
  }

  async fetchNodeMetrics() {
    const nodes = await this.$dispatch('cluster/findAll', { type: NODE }, { root: true });
    const nodeMetrics = await this.$dispatch('cluster/findAll', { type: NODE }, { root: true });

    const someNonWorkerRoles = nodes.some(node => node.hasARole && !node.isWorker);

    const metrics = nodeMetrics.filter((metric) => {
      const node = nodes.find(nd => nd.id === metric.id);

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

  get nodes() {
    return this.$getters['all'](MANAGEMENT.NODE).filter(node => node.id.startsWith(this.id));
  }
}
