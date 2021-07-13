import { NODE } from '@/config/types';
const LATEST_UPGRADE_RESOURCE = 'harvesterhci.io/latestUpgrade';

export default {
  isCurrentUpgrade() {
    return this?.metadata?.labels?.[LATEST_UPGRADE_RESOURCE] === 'true';
  },

  nodes() {
    return this.$rootGetters['cluster/all'](NODE);
  },

  upgradeMessage() {
    const upgradeMessage = [];
    const nodeStatuses = this?.status?.nodeStatuses || {};
    const conditions = this?.status?.conditions || [];

    for (const key in nodeStatuses) {
      const state = nodeStatuses[key]?.state;

      if (nodeStatuses[key] && state !== 'Succeeded' && state !== 'succeeded') {
        upgradeMessage.push({
          id:      key,
          message: `The node ${ key } is ${ nodeStatuses[key]?.state }`
        });
      }
    }

    for (let i = 0; i < conditions.length; i++) {
      const type = conditions[i].type;

      if (type === 'systemServiceUpgraded' && conditions[i]?.status !== 'True') {
        upgradeMessage.push({
          id:      'systemService',
          message: `The systemService is upgrading`
        });
      }
    }

    if (this.metadata?.state?.message && this.metadata?.state?.error) {
      upgradeMessage.push({
        id:      'message',
        message: `${ this.metadata.state.message }`
      });
    }

    return upgradeMessage;
  },

  nodeUpgradeMessage() {
    const message = [];
    const nodeStatuses = this?.status?.nodeStatuses || {};

    for (const key in nodeStatuses) {
      const state = nodeStatuses[key]?.state;
      const _message = nodeStatuses[key]?.message;

      let percent = 0;

      if (state === 'Upgrading') {
        percent = 50;
      } else if (state === 'Succeeded' || state === 'succeeded') {
        percent = 100;
      }

      message.push({
        name:    key,
        state,
        percent,
        message: _message
      });
    }

    for (const node of this.nodes) {
      const hasNode = message.find( O => O.name === node.id);

      if (!hasNode) {
        message.push({
          name:    node.id,
          state:   'Pending',
          percent: 0,
        });
      }
    }

    return message;
  },

  nodeTotalPercent() {
    let out = 0;

    for (let i = 0; i < this.nodeUpgradeMessage.length; i++) {
      out += this.nodeUpgradeMessage[i].percent;
    }

    out = Math.floor(out / this.nodeUpgradeMessage.length);

    const nodeUpgradedCondition = this.getConditionStatus('nodesUpgraded');

    if (out === 100 && !nodeUpgradedCondition) {
      out = 99;
    }

    return out;
  },

  sysServiceUpgradeMessage() {
    let percent = 0;
    let state = 'Pending';
    const message = [];
    const conditions = this?.status?.conditions || [];

    for (let i = 0; i < conditions.length; i++) {
      const type = conditions[i].type;

      if (type === 'systemServicesUpgraded') {
        if (conditions[i].status === 'True') {
          percent = 100;
          state = 'Succeeded';
        } else {
          percent = 50;
        }

        message.push({
          name:    'system services',
          state,
          percent,
          message: conditions[i]?.message
        });
      }
    }

    if (message.length === 0) {
      message.push({
        name: 'system services',
        state,
        percent,
      });
    }

    return message;
  },

  totalPercent() {
    const nodePercent = this.nodeTotalPercent * this.nodeUpgradeMessage.length;
    const servicePercent = this.sysServiceUpgradeMessage?.[0].percent;

    return Math.floor((nodePercent + servicePercent) / (this.nodeUpgradeMessage.length + 1));
  }
};
