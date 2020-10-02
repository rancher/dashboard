import { CATALOG } from '@/config/labels-annotations';
import { FLEET } from '@/config/types';
import { insertAt } from '@/utils/array';

export default {
  scope() {
    return this.id === 'local' ? CATALOG._MANAGEMENT : CATALOG._DOWNSTREAM;
  },

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

  isReady() {
    return this.hasCondition('Ready');
  },

  configName() {
    const allKeys = Object.keys(this.spec);
    const configKey = allKeys.find( kee => kee.includes('Config'));

    return configKey;
  },

  kubernetesVersion() {
    if ( this?.status?.version?.gitVersion ) {
      return this.status.version.gitVersion;
    } else {
      return this.$rootGetters['i18n/t']('generic.unknown');
    }
  },

  canDelete() {
    return this.hasLink('remove') && !this?.spec?.internal;
  },

  groupByLabel() {
    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAWorkspace');
  },

  setClusterNameLabel() {
    return (andSave) => {
      if ( this.ownerReferences?.length ) {
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
};
