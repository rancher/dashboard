import { MANAGEMENT } from '@/config/types';
import { escapeHtml } from '@/utils/string';
import { insertAt } from '@/utils/array';
import { FLEET as FLEET_LABELS } from '@/config/labels-annotations';

export default {
  _availableActions() {
    const out = this._standardActions;

    insertAt(out, 0, {
      action:     'pause',
      label:      'Pause',
      icon:       'icon icon-pause',
      enabled:    !!this.links.update && !this.spec?.paused
    });

    insertAt(out, 1, {
      action:     'unpause',
      label:      'Unpause',
      icon:       'icon icon-play',
      enabled:    !!this.links.update && this.spec?.paused === true
    });

    insertAt(out, 2, {
      action:     'forceUpdate',
      label:      'Force Update',
      icon:       'icon icon-refresh',
      enabled:    !!this.links.update
    });

    insertAt(out, 3, {
      action:     'assignTo',
      label:      'Assign to...',
      icon:       'icon icon-copy',
      bulkable:   true,
      bulkAction: 'assignToBulk',
      enabled:    !!this.links.update && !!this.mgmt,
    });

    insertAt(out, 4, { divider: true });

    return out;
  },

  pause() {
    this.spec.paused = true;
    this.save();
  },

  unpause() {
    this.spec.paused = false;
    this.save();
  },

  assignTo() {
    return () => {
      this.$dispatch('assignTo', [this]);
    };
  },

  assignToBulk() {
    return (items) => {
      this.$dispatch('assignTo', items);
    };
  },

  forceUpdate() {
    const now = (new Date()).toISOString().replace(/\.\d+Z$/, 'Z');

    this.spec.forceUpdateAgent = now;
    this.save();
  },

  nameDisplay() {
    return this.metadata?.labels?.[FLEET_LABELS.CLUSTER_NAME] || this.metadata?.name || this.id;
  },

  state() {
    if ( this.spec?.paused === true ) {
      return 'paused';
    }

    return this.metadata?.state?.name || 'unknown';
  },

  nodeInfo() {
    const ready = this.status?.agent?.readyNodes || 0;
    const unready = this.status?.agent?.nonReadyNodes || 0;

    return {
      ready,
      unready,
      total: ready + unready,
    };
  },

  repoInfo() {
    const ready = this.status?.readyGitRepos || 0;
    const total = this.status?.desiredReadyGitRepos || 0;

    return {
      ready,
      unready: total - ready,
      total,
    };
  },

  mgmt() {
    const mgmt = this.$getters['byId'](MANAGEMENT.CLUSTER, this.metadata.name);

    return mgmt;
  },

  groupByLabel() {
    const name = this.metadata.namespace;

    if ( name ) {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.workspace', { name: escapeHtml(name) });
    } else {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAWorkspace');
    }
  },
};
