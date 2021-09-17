import { CATALOG } from '@/config/labels-annotations';
import { FLEET, MANAGEMENT, NODE } from '@/config/types';
import { insertAt } from '@/utils/array';
import { downloadFile } from '@/utils/download';
import { parseSi } from '@/utils/units';
import jsyaml from 'js-yaml';
import { eachLimit } from '@/utils/promise';
import { addParams } from '@/utils/url';
import { isEmpty } from '@/utils/object';
import { NAME as HARVESTER } from '@/config/product/harvester';
import { isHarvesterCluster } from '@/utils/cluster';
import { KONTAINER_TO_DRIVER } from './management.cattle.io.kontainerdriver';

// See translation file cluster.providers for list of providers
// If the logo is not named with the provider name, add an override here
const PROVIDER_LOGO_OVERRIDE = {};

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
      enabled:    !!this.links.shell,
    });

    insertAt(out, 1, {
      action:     'downloadKubeConfig',
      bulkAction: 'downloadKubeConfigBulk',
      label:      'Download KubeConfig',
      icon:       'icon icon-download',
      bulkable:   true,
      enabled:    this.$rootGetters['isRancher'],
    });

    return out;
  },

  canDelete() {
    return this.hasLink('remove') && !this?.spec?.internal;
  },

  machinePools() {
    const pools = this.$getters['all'](MANAGEMENT.NODE_POOL);

    return pools.filter(x => x.spec?.clusterName === this.id);
  },

  provisioner() {
    return this.status.driver ? this.status.driver : 'imported';
  },

  machineProvider() {
    const kind = this.machinePools?.[0]?.provider;

    if ( kind ) {
      return kind.replace(/config$/i, '').toLowerCase();
    } else if ( this.spec?.internal ) {
      return 'local';
    }
  },

  emberEditPath() {
    // Ember wants one word called provider to tell what component to show, but has much indirect mapping to figure out what it is.
    let provider;

    // Provisioner is the "<something>Config" in the model
    const provisioner = KONTAINER_TO_DRIVER[(this.provisioner || '').toLowerCase()] || this.provisioner;

    if ( provisioner === 'rancherKubernetesEngine' ) {
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

    const qp = { provider };

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

    return addParams(`/c/${ escape(this.id) }/edit`, qp);
  },

  groupByLabel() {
    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAWorkspace');
  },

  isReady() {
    // If the Connected condition exists, use that (2.6+)
    if ( this.hasCondition('Connected') ) {
      return this.isCondition('Connected');
    }

    // Otherwise use Ready (older)
    return this.isCondition('Ready');
  },

  kubernetesVersionRaw() {
    const fromStatus = this.status?.version?.gitVersion;
    const fromSpec = this.spec?.[`${ this.provisioner }Config`]?.kubernetesVersion;

    return fromStatus || fromSpec;
  },

  kubernetesVersion() {
    return this.kubernetesVersionRaw || this.$rootGetters['i18n/t']('generic.provisioning');
  },

  kubernetesVersionBase() {
    return this.kubernetesVersion.replace(/[+-].*$/, '');
  },

  kubernetesVersionExtension() {
    if ( this.kubernetesVersion.match(/[+-]]/) ) {
      return this.kubernetesVersion.replace(/^.*([+-])/, '$1');
    }

    return '';
  },

  providerOs() {
    if ( this.status?.provider.endsWith('.windows') ) {
      return 'windows';
    }

    return 'linux';
  },

  providerOsLogo() {
    return require(`~/assets/images/vendor/${ this.providerOs }.svg`);
  },

  isLocal() {
    return this.spec?.internal === true;
  },

  isHarvester() {
    return isHarvesterCluster(this);
  },

  providerLogo() {
    const provider = this.status?.provider || 'kubernetes';
    // Only interested in the part before the period
    const prv = provider.split('.')[0];
    // Allow overrides if needed
    const logo = PROVIDER_LOGO_OVERRIDE[prv] || prv;

    let icon;

    try {
      icon = require(`~/assets/images/providers/${ prv }.svg`);
    } catch (e) {
      console.warn(`Can not find provider logo for provider ${ logo }`); // eslint-disable-line no-console
      // Use fallback generic Kubernetes icon
      icon = require(`~/assets/images/providers/kubernetes.svg`);
    }

    return icon;
  },

  providerMenuLogo() {
    if (this?.status?.provider === HARVESTER) {
      return require(`~/assets/images/providers/kubernetes.svg`);
    }

    return this.providerLogo;
  },

  providerNavLogo() {
    if (this?.status?.provider === HARVESTER && this.$rootGetters['currentProduct'].inStore !== HARVESTER) {
      return require(`~/assets/images/providers/kubernetes.svg`);
    }

    return this.providerLogo;
  },

  scope() {
    return this.isLocal ? CATALOG._MANAGEMENT : CATALOG._DOWNSTREAM;
  },

  setClusterNameLabel() {
    return (andSave) => {
      if ( this.ownerReferences?.length || this.metadata?.labels?.[FLEET.CLUSTER_NAME] === this.id ) {
        return;
      }

      this.metadata = this.metadata || {};
      this.metadata.labels = this.metadata.labels || {};
      this.metadata.labels[FLEET.CLUSTER_NAME] = this.id;

      if ( andSave ) {
        return this.save();
      }
    };
  },

  availableCpu() {
    const reserved = parseSi(this.status.requested?.cpu);
    const allocatable = parseSi(this.status.allocatable?.cpu);

    if ( allocatable > 0 && reserved >= 0 ) {
      return Math.max(0, allocatable - reserved);
    } else {
      return null;
    }
  },

  availableMemory() {
    const reserved = parseSi(this.status.requested?.memory);
    const allocatable = parseSi(this.status.allocatable?.memory);

    if ( allocatable > 0 && reserved >= 0 ) {
      return Math.max(0, allocatable - reserved);
    } else {
      return null;
    }
  },

  openShell() {
    return () => {
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
    };
  },

  generateKubeConfig() {
    return async() => {
      const res = await this.doAction('generateKubeconfig');

      return res.config;
    };
  },

  downloadKubeConfig() {
    return async() => {
      const config = await this.generateKubeConfig();

      downloadFile(`${ this.nameDisplay }.yaml`, config, 'application/yaml');
    };
  },

  downloadKubeConfigBulk() {
    return async(items) => {
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
    };
  },

  fetchNodeMetrics() {
    return async() => {
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
    };
  },

  nodes() {
    return this.$getters['all'](MANAGEMENT.NODE).filter(node => node.id.startsWith(this.id));
  },
};
