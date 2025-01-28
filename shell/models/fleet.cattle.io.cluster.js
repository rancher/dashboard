import { LOCAL_CLUSTER, MANAGEMENT, NORMAN } from '@shell/config/types';
import { CAPI, FLEET as FLEET_LABELS, SYSTEM_LABELS } from '@shell/config/labels-annotations';
import { _RKE2 } from '@shell/store/prefs';
import SteveModel from '@shell/plugins/steve/steve-class';
import { escapeHtml } from '@shell/utils/string';
import { insertAt } from '@shell/utils/array';
import jsyaml from 'js-yaml';
import { FLEET_WORKSPACE_BACK } from '@shell/store/features';

export default class FleetCluster extends SteveModel {
  get _availableActions() {
    const out = super._availableActions;

    insertAt(out, 0, {
      action:   'pause',
      label:    'Pause',
      icon:     'icon icon-pause',
      bulkable: true,
      enabled:  !!this.links.update && !this.spec?.paused
    });

    insertAt(out, 1, {
      action:   'unpause',
      label:    'Unpause',
      icon:     'icon icon-play',
      bulkable: true,
      enabled:  !!this.links.update && this.spec?.paused === true
    });

    insertAt(out, 2, {
      action:   'forceUpdate',
      label:    'Force Update',
      icon:     'icon icon-refresh',
      bulkable: true,
      enabled:  !!this.links.update
    });

    if (this.canChangeWorkspace) {
      insertAt(out, 3, {
        action:     'assignTo',
        label:      'Change workspace',
        icon:       'icon icon-copy',
        bulkable:   true,
        bulkAction: 'assignToBulk',
        enabled:    !!this.links.update && !!this.mgmt,
      });
    }

    insertAt(out, 4, { divider: true });

    return out;
  }

  pause() {
    this.spec.paused = true;
    this.save();
  }

  unpause() {
    this.spec.paused = false;
    this.save();
  }

  forceUpdate() {
    const now = this.spec.redeployAgentGeneration || 1;

    this.spec.redeployAgentGeneration = now + 1;
    this.save();
  }

  assignTo() {
    this.$dispatch('assignTo', [this]);
  }

  assignToBulk(items) {
    this.$dispatch('assignTo', items);
  }

  get canDelete() {
    return false;
  }

  get canChangeWorkspace() {
    // https://github.com/rancher/dashboard/issues/7745
    if (this.isLocal) {
      return false;
    }
    // https://github.com/rancher/dashboard/issues/9730
    if (this.isRke2) {
      return this.$rootGetters['features/get'](FLEET_WORKSPACE_BACK);
    }

    return true;
  }

  get isLocal() {
    return this.metadata.name === LOCAL_CLUSTER || this.metadata?.labels?.[FLEET_LABELS.CLUSTER_NAME] === LOCAL_CLUSTER;
  }

  get isRke2() {
    const provider = this?.metadata?.labels?.[CAPI.PROVIDER] || this?.status?.provider;

    return provider === _RKE2;
  }

  get nameDisplay() {
    return this.metadata?.labels?.[FLEET_LABELS.CLUSTER_DISPLAY_NAME] || this.metadata?.name || this.id;
  }

  get name() {
    return this.metadata?.name || this.metadata?.labels?.[FLEET_LABELS.CLUSTER_NAME];
  }

  get state() {
    if (this.spec?.paused === true) {
      return 'paused';
    }

    return this.metadata?.state?.name || 'unknown';
  }

  get repoInfo() {
    const ready = this.status?.readyGitRepos || 0;
    const total = this.status?.desiredReadyGitRepos || 0;

    return {
      ready,
      unready: total - ready,
      total,
    };
  }

  get bundleInfo() {
    const bundlesData = {
      ready: 0,
      total: 0
    };
    const readyBundles = this.status?.display?.readyBundles;

    if (readyBundles && readyBundles.includes('/')) {
      const dataArr = readyBundles.split('/');

      if (dataArr.length === 2 && parseInt(dataArr[0]) >= 0 && parseInt(dataArr[1]) >= 0) {
        bundlesData.ready = parseInt(dataArr[0]);
        bundlesData.total = parseInt(dataArr[1]);

        return bundlesData;
      }
    }

    bundlesData.noValidData = true;

    return bundlesData;
  }

  get mgmt() {
    const mgmt = this.$getters['byId'](MANAGEMENT.CLUSTER, this.metadata?.labels?.[FLEET_LABELS.CLUSTER_NAME]);

    return mgmt;
  }

  get basicNorman() {
    const norman = this.$rootGetters['rancher/byId'](NORMAN.CLUSTER, this.metadata?.labels?.[FLEET_LABELS.CLUSTER_NAME]);

    return norman;
  }

  get norman() {
    if (this.basicNorman) {
      return this.basicNorman;
    }

    // If navigate to YAML view directly, norman is not loaded yet
    return this.$dispatch('rancher/find', { type: NORMAN.CLUSTER, id: this.metadata.labels[FLEET_LABELS.CLUSTER_NAME] }, { root: true });
  }

  async normanClone() {
    const norman = await this.norman;

    return this.$dispatch('rancher/clone', { resource: norman }, { root: true });
  }

  get groupByLabel() {
    const name = this.metadata.namespace;

    if (name) {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.workspace', { name: escapeHtml(name) });
    } else {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAWorkspace');
    }
  }

  get customLabels() {
    const parsedLabels = [];

    if (this.labels) {
      for (const k in this.labels) {
        const [prefix] = k.split('/');

        if (!SYSTEM_LABELS.includes(prefix) && k !== CAPI.PROVIDER) {
          parsedLabels.push(`${ k }=${ this.labels[k] }`);
        }
      }
    }

    return parsedLabels;
  }

  async saveYaml(yaml) {
    await this._saveYaml(yaml);

    const parsed = jsyaml.load(yaml);

    const norman = await this.normanClone();

    norman.setLabels(parsed.metadata.labels);
    norman.setAnnotations(parsed.metadata.annotations);

    await norman.save();
  }
}
