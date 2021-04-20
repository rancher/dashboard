import { CATALOG } from '@/config/labels-annotations';
import { FLEET } from '@/config/types';
import { insertAt } from '@/utils/array';
import { parseSi } from '@/utils/units';

// See translation file cluster.providers for list of providers
// If the logo is not named with the provider name, add an override here
const PROVIDER_LOGO_OVERRIDE = {};

export default {
  _availableActions() {
    const out = this._standardActions;

    insertAt(out, 0, {
      action:     'openShell',
      label:      'Kubectl Shell',
      icon:       'icon icon-terminal',
      enabled:    !!this.links.shell,
    });

    return out;
  },

  canDelete() {
    return this.hasLink('remove') && !this?.spec?.internal;
  },

  configName() {
    const allKeys = Object.keys(this.spec);
    const configKey = allKeys.find( kee => kee.includes('Config'));

    return configKey;
  },

  groupByLabel() {
    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAWorkspace');
  },

  isReady() {
    return this.hasCondition('Ready');
  },

  kubernetesVersion() {
    if ( this?.status?.version?.gitVersion ) {
      return this.status.version.gitVersion;
    } else {
      return this.$rootGetters['i18n/t']('generic.unknown');
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

  providerOs() {
    if ( this.status?.provider === 'rke.windows' ) {
      return 'windows';
    }

    return 'linux';
  },

  providerOsLogo() {
    return require(`~/assets/images/vendor/${ this.providerOs }.svg`);
  },

  providerLogo() {
    const provider = this.status?.provider || 'kubernetes';
    // Only interested in the part before the period
    const prv = provider.split('.')[0];
    // Allow overrides if needed
    const logo = PROVIDER_LOGO_OVERRIDE[prv] || prv;

    let icon;

    try {
      icon = require(`~/assets/images/providers/provider-${ prv }.svg`);
    } catch (e) {
      console.warn(`Can not find provider logo for provider ${ logo }`); // eslint-disable-line no-console
      // Use fallback generic Kubernetes icon
      icon = require(`~/assets/images/providers/kubernetes.svg`);
    }

    return icon;
  },

  scope() {
    return this.id === 'local' ? CATALOG._MANAGEMENT : CATALOG._DOWNSTREAM;
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
  }
};
