import { MANAGEMENT, NORMAN } from '@shell/config/types';
import { escapeHtml } from '@shell/utils/string';
import { insertAt } from '@shell/utils/array';
import { FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class FleetCluster extends SteveModel {
  get _availableActions() {
    const out = super._availableActions;

    insertAt(out, 0, {
      action:     'pause',
      label:      'Pause',
      icon:       'icon icon-pause',
      bulkable:    true,
      enabled:    !!this.links.update && !this.spec?.paused
    });

    insertAt(out, 1, {
      action:     'unpause',
      label:      'Unpause',
      icon:       'icon icon-play',
      bulkable:    true,
      enabled:    !!this.links.update && this.spec?.paused === true
    });

    insertAt(out, 2, {
      action:     'forceUpdate',
      label:      'Force Update',
      icon:       'icon icon-refresh',
      bulkable:   true,
      enabled:    !!this.links.update
    });

    insertAt(out, 3, {
      action:     'assignTo',
      label:      'Change workspace',
      icon:       'icon icon-copy',
      bulkable:   true,
      bulkAction: 'assignToBulk',
      enabled:    !!this.links.update && !!this.mgmt,
    });

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

  get nameDisplay() {
    return this.metadata?.labels?.[FLEET_LABELS.CLUSTER_DISPLAY_NAME] || this.metadata?.name || this.id;
  }

  get state() {
    if ( this.spec?.paused === true ) {
      return 'paused';
    }

    return this.metadata?.state?.name || 'unknown';
  }

  get nodeInfo() {
    const ready = this.status?.agent?.readyNodes || 0;
    const unready = this.status?.agent?.nonReadyNodes || 0;

    return {
      ready,
      unready,
      total: ready + unready,
    };
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

  get mgmt() {
    const mgmt = this.$getters['byId'](MANAGEMENT.CLUSTER, this.metadata?.labels?.[FLEET_LABELS.CLUSTER_NAME]);

    return mgmt;
  }

  get norman() {
    const norman = this.$rootGetters['rancher/byId'](NORMAN.CLUSTER, this.metadata.labels?.[FLEET_LABELS.CLUSTER_NAME]);

    return norman;
  }

  get groupByLabel() {
    const name = this.metadata.namespace;

    if ( name ) {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.workspace', { name: escapeHtml(name) });
    } else {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAWorkspace');
    }
  }
}
