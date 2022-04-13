import jsyaml from 'js-yaml';
import { NODE } from '@shell/config/types';
import SteveModel from '@shell/plugins/steve/steve-class';
import { colorForState } from '@shell/plugins/steve/resource-class';
import { HCI } from '@shell/config/labels-annotations';

export default class HciUpgrade extends SteveModel {
  get isLatestUpgrade() {
    return this?.metadata?.labels?.[HCI.LATEST_UPGRADE] === 'true';
  }

  get isUpgradeSucceeded() {
    return this?.metadata?.labels?.[HCI.UPGRADE_STATE] === 'Succeeded';
  }

  get hasReadMessage() {
    return this?.metadata?.labels?.[HCI.REAY_MESSAGE] === 'true';
  }

  get repoInfo() {
    const repoInfo = this?.status?.repoInfo;

    if (repoInfo) {
      try {
        return jsyaml.load(repoInfo);
      } catch (e) {
        return false;
      }
    }

    return false;
  }

  get stateDisplay() {
    const conditions = this?.status?.conditions || [];
    const completedCondition = conditions.find( cond => cond.type === 'Completed');
    const status = completedCondition?.status;

    if (status === 'True') {
      return 'Success';
    } else if (status === 'False') {
      return 'Fail';
    } else {
      return 'on-going';
    }
  }

  get stateColor() {
    return colorForState(this.stateDisplay);
  }

  get nodes() {
    return this.$rootGetters['harvester/all'](NODE);
  }

  get upgradeImage() {
    return this?.status?.imageID;
  }

  get upgradeMessage() {
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
  }

  get createRepo() {
    const conditions = this?.status?.conditions || [];
    const repoCondition = conditions.find( cond => cond.type === 'RepoReady');
    const isReady = repoCondition?.status === 'True';

    return {
      isReady,
      message: repoCondition?.message || repoCondition?.reason
    };
  }

  get overallMessage() {
    const conditions = this?.status?.conditions || [];
    const completedCondition = conditions.find( cond => cond.type === 'Completed');
    const hasError = completedCondition?.status === 'False';
    const message = completedCondition?.message || completedCondition?.reason;

    return hasError ? message : '';
  }

  get upgradeImageMessage() {
    const conditions = this?.status?.conditions || [];
    const imageReady = conditions.find( cond => cond.type === 'ImageReady');
    const hasError = imageReady?.status === 'False';
    const message = imageReady?.message || imageReady?.reason;

    return hasError ? message : '';
  }

  get nodeUpgradeMessage() {
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
  }

  get nodeTotalPercent() {
    let out = 0;

    for (let i = 0; i < this.nodeUpgradeMessage.length; i++) {
      out += this.nodeUpgradeMessage[i].percent;
    }

    out = Math.floor(out / this.nodeUpgradeMessage.length);
    const conditions = this?.status?.conditions || [];
    const nodeUpgradedCondition = conditions.find( cond => cond.type === 'NodesUpgraded');

    if (out === 100 && !nodeUpgradedCondition) {
      out = 99;
    }

    return out;
  }

  get sysServiceUpgradeMessage() {
    let percent = 0;
    let state = 'Pending';
    const message = [];
    const conditions = this?.status?.conditions || [];

    for (let i = 0; i < conditions.length; i++) {
      const type = conditions[i].type;

      if (type === 'SystemServicesUpgraded') {
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
  }

  get totalPercent() {
    const nodePercent = this.nodeTotalPercent * this.nodeUpgradeMessage.length;
    const servicePercent = this.sysServiceUpgradeMessage?.[0].percent;

    return Math.floor((nodePercent + servicePercent) / (this.nodeUpgradeMessage.length + 1));
  }
}
