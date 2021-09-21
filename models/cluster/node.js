import { formatPercent } from '@/utils/string';
import { CAPI as CAPI_ANNOTATIONS, NODE_ROLES, RKE } from '@/config/labels-annotations.js';
import {
  CAPI, MANAGEMENT, METRIC, NORMAN, POD
} from '@/config/types';
import { parseSi } from '@/utils/units';
import findLast from 'lodash/findLast';

export const listNodeRoles = (isControlPlane, isWorker, isEtcd, allString) => {
  const res = [];

  if (isControlPlane) {
    res.push('Control Plane');
  }
  if (isWorker) {
    res.push('Worker');
  }
  if (isEtcd) {
    res.push('Etcd');
  }
  if (res.length === 3 || res.length === 0) {
    return allString;
  }

  return res.join(', ');
};

export default {
  _availableActions() {
    const normanAction = this.norman?.actions || {};

    const cordon = {
      action:     'cordon',
      enabled:    !!normanAction.cordon,
      icon:       'icon icon-fw icon-pause',
      label:      'Cordon',
      total:      1,
      bulkable:   true
    };

    const uncordon = {
      action:     'uncordon',
      enabled:    !!normanAction.uncordon,
      icon:       'icon icon-fw icon-play',
      label:      'Uncordon',
      total:      1,
      bulkable:   true
    };

    const drain = {
      action:     'drain',
      enabled:     !!normanAction.drain,
      icon:       'icon icon-fw icon-dot-open',
      label:      this.t('drainNode.action'),
      bulkable:   true,
      bulkAction: 'drain'
    };

    const stopDrain = {
      action:     'stopDrain',
      enabled:    !!normanAction.stopDrain,
      icon:       'icon icon-fw icon-x',
      label:      this.t('drainNode.actionStop'),
      bulkable:   true,
    };

    const openSsh = {
      action:     'openSsh',
      enabled:    !!this.provisionedMachine?.links?.shell,
      icon:       'icon icon-fw icon-chevron-right',
      label:      'SSH Shell',
    };

    const downloadKeys = {
      action:     'downloadKeys',
      enabled:    !!this.provisionedMachine?.links?.sshkeys,
      icon:       'icon icon-fw icon-download',
      label:      this.t('node.actions.downloadSSHKey'),
    };

    return [
      openSsh,
      downloadKeys,
      { divider: true },
      cordon,
      uncordon,
      drain,
      stopDrain,
      { divider: true },
      ...this._standardActions
    ];
  },

  openSsh() {
    return () => {
      this.provisionedMachine.openSsh();
    };
  },

  downloadKeys() {
    return () => {
      this.provisionedMachine.downloadKeys();
    };
  },

  showDetailStateBadge() {
    return true;
  },

  name() {
    return this.metadata.name;
  },

  internalIp() {
    const addresses = this.status?.addresses || [];

    return findLast(addresses, address => address.type === 'InternalIP')?.address;
  },

  externalIp() {
    const addresses = this.status?.addresses || [];
    const annotationAddress = this.metadata.annotations[RKE.EXTERNAL_IP];
    const statusAddress = findLast(addresses, address => address.type === 'ExternalIP')?.address;

    return statusAddress || annotationAddress;
  },

  labels() {
    return this.metadata?.labels || {};
  },

  isWorker() {
    return this.managementNode ? this.managementNode.isWorker : `${ this.labels[NODE_ROLES.WORKER] }` === 'true';
  },

  isControlPlane() {
    if (this.managementNode) {
      return this.managementNode.isControlPlane;
    } else if (
      `${ this.labels[NODE_ROLES.CONTROL_PLANE] }` === 'true' ||
      `${ this.labels[NODE_ROLES.CONTROL_PLANE_OLD] }` === 'true'
    ) {
      return true;
    }

    return false;
  },

  isEtcd() {
    return this.managementNode ? this.managementNode.isEtcd : `${ this.labels[NODE_ROLES.ETCD] }` === 'true';
  },

  hasARole() {
    const roleLabelKeys = Object.values(NODE_ROLES);

    return Object.keys(this.labels)
      .some((labelKey) => {
        const hasRoleLabel = roleLabelKeys.includes(labelKey);
        const isExpectedValue = `${ this.labels[labelKey] }` === 'true';

        return hasRoleLabel && isExpectedValue;
      });
  },

  roles() {
    const { isControlPlane, isWorker, isEtcd } = this;

    return listNodeRoles(isControlPlane, isWorker, isEtcd, this.t('generic.all'));
  },

  version() {
    return this.status.nodeInfo.kubeletVersion;
  },

  cpuUsage() {
    return parseSi(this.$rootGetters['cluster/byId'](METRIC.NODE, this.id)?.usage?.cpu || '0');
  },

  cpuCapacity() {
    return parseSi(this.status.allocatable.cpu);
  },

  cpuUsagePercentage() {
    return ((this.cpuUsage * 100) / this.cpuCapacity).toString();
  },

  ramUsage() {
    return parseSi(this.$rootGetters['cluster/byId'](METRIC.NODE, this.id)?.usage?.memory || '0');
  },

  ramCapacity() {
    return parseSi(this.status.capacity.memory);
  },

  ramUsagePercentage() {
    return ((this.ramUsage * 100) / this.ramCapacity).toString();
  },

  podUsage() {
    return calculatePercentage(this.status.allocatable.pods, this.status.capacity.pods);
  },

  podConsumedUsage() {
    return ((this.podConsumed / this.podCapacity) * 100).toString();
  },

  podCapacity() {
    return Number.parseInt(this.status.capacity.pods);
  },

  podConsumed() {
    return this.runningPods.length;
  },

  isPidPressureOk() {
    return this.isCondition('PIDPressure', 'False');
  },

  isDiskPressureOk() {
    return this.isCondition('DiskPressure', 'False');
  },

  isMemoryPressureOk() {
    return this.isCondition('MemoryPressure', 'False');
  },

  isKubeletOk() {
    return this.isCondition('Ready');
  },

  isCordoned() {
    return !!this.spec.unschedulable;
  },

  drainedState() {
    const sNodeCondition = this.managementNode?.status.conditions.find(c => c.type === 'Drained');

    if (sNodeCondition) {
      if (sNodeCondition.status === 'True') {
        return 'drained';
      }
      if (sNodeCondition.transitioning) {
        return 'draining';
      }
    }

    return null;
  },

  containerRuntimeVersion() {
    return this.status.nodeInfo.containerRuntimeVersion.replace('docker://', '');
  },

  containerRuntimeIcon() {
    if ( this.status.nodeInfo.containerRuntimeVersion.includes('docker') ) {
      return 'icon-docker';
    }

    return '';
  },

  cordon() {
    return async(resources) => {
      const safeResources = Array.isArray(resources) ? resources : [this];

      await Promise.all(safeResources.map((node) => {
        return node.norman?.doAction('cordon');
      }));
    };
  },

  uncordon() {
    return async(resources) => {
      const safeResources = Array.isArray(resources) ? resources : [this];

      await Promise.all(safeResources.map((node) => {
        return node.norman?.doAction('uncordon');
      }));
    };
  },

  clusterId() {
    const parts = this.links.self.split('/');

    return parts[parts.length - 4];
  },

  normanNodeId() {
    const managementNode = (this.$rootGetters['management/all'](MANAGEMENT.NODE) || []).find((n) => {
      return n.id.startsWith(this.clusterId) && n.status.nodeName === this.name;
    });

    if (managementNode) {
      return managementNode.id.replace('/', ':');
    }
  },

  norman() {
    return this.$rootGetters['rancher/byId'](NORMAN.NODE, this.normanNodeId);
  },

  managementNode() {
    return this.$rootGetters['management/all'](MANAGEMENT.NODE).find((mNode) => {
      return mNode.id.startsWith(this.clusterId) && mNode.status.nodeName === this.id;
    });
  },

  drain() {
    return (resources) => {
      this.$dispatch('promptModal', { component: 'DrainNode', resources: [resources || [this], this.normanNodeId] });
    };
  },

  stopDrain() {
    return async(resources) => {
      const safeResources = Array.isArray(resources) ? resources : [this];

      await Promise.all(safeResources.map((node) => {
        return node.norman?.doAction('stopDrain');
      }));
    };
  },

  state() {
    if (this.drainedState) {
      return this.drainedState;
    }

    if ( this.isCordoned ) {
      return 'cordoned';
    }

    return this.metadata?.state?.name || 'unknown';
  },

  details() {
    const details = [
      {
        label:    this.t('node.detail.detailTop.version'),
        content:  this.version
      },
      {
        label:    this.t('node.detail.detailTop.os'),
        content:  this.status.nodeInfo.osImage
      },
      {
        label:         this.t('node.detail.detailTop.containerRuntime'),
        formatter:     'IconText',
        formatterOpts: { iconClass: this.containerRuntimeIcon },
        content:       this.containerRuntimeVersion
      }];

    if (this.internalIp) {
      details.unshift({
        label:         this.t('node.detail.detailTop.internalIP'),
        formatter:     'CopyToClipboard',
        content:       this.internalIp
      });
    }

    if (this.externalIp) {
      details.unshift({
        label:         this.t('node.detail.detailTop.externalIP'),
        formatter:     'CopyToClipboard',
        content:       this.externalIp
      });
    }

    return details;
  },

  pods() {
    const allPods = this.$rootGetters['cluster/all'](POD);

    return allPods.filter(pod => pod.spec.nodeName === this.name);
  },

  runningPods() {
    return this.pods.filter(pod => pod.isRunning);
  },

  confirmRemove() {
    return true;
  },

  canClone() {
    return false;
  },

  canDelete() {
    const provider = this.$rootGetters['currentCluster'].provisioner.toLowerCase();
    const cloudProviders = [
      'aks', 'azureaks', 'azurekubernetesservice',
      'eks', 'amazoneks',
      'gke', 'googlegke'
    ];

    return !cloudProviders.includes(provider);
  },

  // You need to preload CAPI.MACHINEs to use this
  provisionedMachine() {
    const namespace = this.metadata?.annotations?.[CAPI_ANNOTATIONS.CLUSTER_NAMESPACE];
    const name = this.metadata?.annotations?.[CAPI_ANNOTATIONS.MACHINE_NAME];

    if ( namespace && name ) {
      return this.$rootGetters['management/byId'](CAPI.MACHINE, `${ namespace }/${ name }`);
    }
  },

};

function calculatePercentage(allocatable, capacity) {
  const c = Number.parseFloat(capacity);
  const a = Number.parseFloat(allocatable);
  const percent = (((c - a) / c) * 100);

  return formatPercent(percent);
}
