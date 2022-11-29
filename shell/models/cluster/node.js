import { formatPercent } from '@shell/utils/string';
import { CAPI as CAPI_ANNOTATIONS, NODE_ROLES, RKE } from '@shell/config/labels-annotations.js';
import {
  CAPI, MANAGEMENT, METRIC, NORMAN, POD
} from '@shell/config/types';
import { parseSi } from '@shell/utils/units';
import findLast from 'lodash/findLast';

import SteveModel from '@shell/plugins/steve/steve-class';
import { LOCAL } from '@shell/config/query-params';

export default class ClusterNode extends SteveModel {
  get _availableActions() {
    const normanAction = this.norman?.actions || {};

    const cordon = {
      action:   'cordon',
      enabled:  !!normanAction.cordon,
      icon:     'icon icon-fw icon-pause',
      label:    'Cordon',
      total:    1,
      bulkable: true
    };

    const uncordon = {
      action:   'uncordon',
      enabled:  !!normanAction.uncordon,
      icon:     'icon icon-fw icon-play',
      label:    'Uncordon',
      total:    1,
      bulkable: true
    };

    const drain = {
      action:     'drain',
      enabled:    !!normanAction.drain,
      icon:       'icon icon-fw icon-dot-open',
      label:      this.t('drainNode.action'),
      bulkable:   true,
      bulkAction: 'drain'
    };

    const stopDrain = {
      action:   'stopDrain',
      enabled:  !!normanAction.stopDrain,
      icon:     'icon icon-fw icon-x',
      label:    this.t('drainNode.actionStop'),
      bulkable: true,
    };

    const openSsh = {
      action:  'openSsh',
      enabled: !!this.provisionedMachine?.links?.shell,
      icon:    'icon icon-fw icon-chevron-right',
      label:   'SSH Shell',
    };

    const downloadKeys = {
      action:  'downloadKeys',
      enabled: !!this.provisionedMachine?.links?.sshkeys,
      icon:    'icon icon-fw icon-download',
      label:   this.t('node.actions.downloadSSHKey'),
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
      ...super._availableActions
    ];
  }

  openSsh() {
    this.provisionedMachine.openSsh();
  }

  downloadKeys() {
    this.provisionedMachine.downloadKeys();
  }

  get showDetailStateBadge() {
    return true;
  }

  get name() {
    return this.metadata.name;
  }

  get internalIp() {
    const addresses = this.status?.addresses || [];

    return findLast(addresses, address => address.type === 'InternalIP')?.address;
  }

  get externalIp() {
    const addresses = this.status?.addresses || [];
    const annotationAddress = this.metadata.annotations[RKE.EXTERNAL_IP];
    const statusAddress = findLast(addresses, address => address.type === 'ExternalIP')?.address;

    return statusAddress || annotationAddress;
  }

  get labels() {
    return this.metadata?.labels || {};
  }

  get isWorker() {
    return this.managementNode ? this.managementNode.isWorker : `${ this.labels[NODE_ROLES.WORKER] }` === 'true';
  }

  get isControlPlane() {
    if (this.managementNode) {
      return this.managementNode.isControlPlane;
    } else if (
      `${ this.labels[NODE_ROLES.CONTROL_PLANE] }` === 'true' ||
      `${ this.labels[NODE_ROLES.CONTROL_PLANE_OLD] }` === 'true'
    ) {
      return true;
    }

    return false;
  }

  get isEtcd() {
    return this.managementNode ? this.managementNode.isEtcd : `${ this.labels[NODE_ROLES.ETCD] }` === 'true';
  }

  get hasARole() {
    const roleLabelKeys = Object.values(NODE_ROLES);

    return Object.keys(this.labels)
      .some((labelKey) => {
        const hasRoleLabel = roleLabelKeys.includes(labelKey);
        const isExpectedValue = `${ this.labels[labelKey] }` === 'true';

        return hasRoleLabel && isExpectedValue;
      });
  }

  get roles() {
    const { isControlPlane, isWorker, isEtcd } = this;

    return listNodeRoles(isControlPlane, isWorker, isEtcd, this.t('generic.all'));
  }

  get version() {
    return this.status.nodeInfo.kubeletVersion;
  }

  get cpuUsage() {
    /*
      With EKS nodes that have been migrated from norman,
      cpu/memory usage is by the annotation `management.cattle.io/pod-requests`
    */
    if ( this.isFromNorman && this.provider === 'eks' ) {
      return parseSi(this.podRequests.cpu || '0');
    }

    return parseSi(this.$rootGetters['cluster/byId'](METRIC.NODE, this.id)?.usage?.cpu || '0');
  }

  get cpuCapacity() {
    return parseSi(this.status.allocatable.cpu);
  }

  get cpuUsagePercentage() {
    return ((this.cpuUsage * 100) / this.cpuCapacity).toString();
  }

  get ramUsage() {
    if ( this.isFromNorman && this.provider === 'eks' ) {
      return parseSi(this.podRequests.memory || '0');
    }

    return parseSi(this.$rootGetters['cluster/byId'](METRIC.NODE, this.id)?.usage?.memory || '0');
  }

  get ramCapacity() {
    return parseSi(this.status.capacity.memory);
  }

  get ramUsagePercentage() {
    return ((this.ramUsage * 100) / this.ramCapacity).toString();
  }

  get podUsage() {
    return calculatePercentage(this.status.allocatable.pods, this.status.capacity.pods);
  }

  get podConsumedUsage() {
    return ((this.podConsumed / this.podCapacity) * 100).toString();
  }

  get podCapacity() {
    return Number.parseInt(this.status.capacity.pods);
  }

  get podConsumed() {
    return this.pods.length;
  }

  get podRequests() {
    return JSON.parse(this.metadata.annotations['management.cattle.io/pod-requests'] || '{}');
  }

  get isPidPressureOk() {
    return this.isCondition('PIDPressure', 'False');
  }

  get isDiskPressureOk() {
    return this.isCondition('DiskPressure', 'False');
  }

  get isMemoryPressureOk() {
    return this.isCondition('MemoryPressure', 'False');
  }

  get isKubeletOk() {
    return this.isCondition('Ready');
  }

  get isCordoned() {
    return !!this.spec.unschedulable;
  }

  get drainedState() {
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
  }

  get containerRuntimeVersion() {
    return this.status.nodeInfo.containerRuntimeVersion.replace('docker://', '');
  }

  get containerRuntimeIcon() {
    if ( this.status.nodeInfo.containerRuntimeVersion.includes('docker') ) {
      return 'icon-docker';
    }

    return '';
  }

  async cordon(resources) {
    const safeResources = Array.isArray(resources) ? resources : [this];

    await Promise.all(safeResources.map((node) => {
      return node.norman?.doAction('cordon');
    }));
  }

  async uncordon(resources) {
    const safeResources = Array.isArray(resources) ? resources : [this];

    await Promise.all(safeResources.map((node) => {
      return node.norman?.doAction('uncordon');
    }));
  }

  /**
   *Find the node's cluster id from it's url
   */
  get clusterId() {
    const parts = this.links.self.split('/');

    // Local cluster url links omit `/k8s/clusters/<cluster id>`
    // `/v1/nodes` vs `k8s/clusters/c-m-274kcrc4/v1/nodes`
    // Be safe when determining this, so work back through the url from a known point
    if (parts.length > 6 && parts[parts.length - 6] === 'k8s' && parts[parts.length - 5] === 'clusters') {
      return parts[parts.length - 4];
    }

    return LOCAL;
  }

  get normanNodeId() {
    const managementNode = (this.$rootGetters['management/all'](MANAGEMENT.NODE) || []).find((n) => {
      return n.id.startsWith(this.clusterId) && n.status.nodeName === this.name;
    });

    if (managementNode) {
      return managementNode.id.replace('/', ':');
    }

    return null;
  }

  get norman() {
    return this.$rootGetters['rancher/byId'](NORMAN.NODE, this.normanNodeId);
  }

  get managementNode() {
    return this.$rootGetters['management/all'](MANAGEMENT.NODE).find((mNode) => {
      return mNode.id.startsWith(this.clusterId) && mNode.status.nodeName === this.id;
    });
  }

  drain(resources) {
    this.$dispatch('promptModal', { component: 'DrainNode', resources: [resources || [this], this.normanNodeId] });
  }

  async stopDrain(resources) {
    const safeResources = Array.isArray(resources) ? resources : [this];

    await Promise.all(safeResources.map((node) => {
      return node.norman?.doAction('stopDrain');
    }));
  }

  get state() {
    if (this.drainedState) {
      return this.drainedState;
    }

    if ( this.isCordoned ) {
      return 'cordoned';
    }

    return this.metadata?.state?.name || 'unknown';
  }

  get details() {
    const details = [
      {
        label:   this.t('node.detail.detailTop.version'),
        content: this.version
      },
      {
        label:   this.t('node.detail.detailTop.os'),
        content: this.status.nodeInfo.osImage
      },
      {
        label:         this.t('node.detail.detailTop.containerRuntime'),
        formatter:     'IconText',
        formatterOpts: { iconClass: this.containerRuntimeIcon },
        content:       this.containerRuntimeVersion
      }];

    if (this.internalIp) {
      details.unshift({
        label:     this.t('node.detail.detailTop.internalIP'),
        formatter: 'CopyToClipboard',
        content:   this.internalIp
      });
    }

    if (this.externalIp) {
      details.unshift({
        label:     this.t('node.detail.detailTop.externalIP'),
        formatter: 'CopyToClipboard',
        content:   this.externalIp
      });
    }

    return details;
  }

  get pods() {
    const allPods = this.$rootGetters['cluster/all'](POD);

    return allPods.filter(pod => pod.spec.nodeName === this.name);
  }

  get confirmRemove() {
    return true;
  }

  get canClone() {
    return false;
  }

  get canDelete() {
    const cloudProviders = [
      'aks', 'azureaks', 'azurekubernetesservice',
      'eks', 'amazoneks',
      'gke', 'googlegke'
    ];

    return !cloudProviders.includes(this.provider);
  }

  // You need to preload CAPI.MACHINEs to use this
  get provisionedMachine() {
    const namespace = this.metadata?.annotations?.[CAPI_ANNOTATIONS.CLUSTER_NAMESPACE];
    const name = this.metadata?.annotations?.[CAPI_ANNOTATIONS.MACHINE_NAME];

    if ( namespace && name ) {
      return this.$rootGetters['management/byId'](CAPI.MACHINE, `${ namespace }/${ name }`);
    }

    return null;
  }

  get isFromNorman() {
    return (this.$rootGetters['currentCluster'].metadata.labels || {})['cattle.io/creator'] === 'norman';
  }

  get provider() {
    return this.$rootGetters['currentCluster'].provisioner.toLowerCase();
  }
}

function calculatePercentage(allocatable, capacity) {
  const c = Number.parseFloat(capacity);
  const a = Number.parseFloat(allocatable);
  const percent = (((c - a) / c) * 100);

  return formatPercent(percent);
}

export function listNodeRoles(isControlPlane, isWorker, isEtcd, allString) {
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
}
