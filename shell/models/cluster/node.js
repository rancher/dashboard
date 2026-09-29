import { formatPercent } from '@shell/utils/string';
import { CAPI as CAPI_ANNOTATIONS, NODE_ROLES, RKE, SYSTEM_LABELS } from '@shell/config/labels-annotations.js';
import {
  CAPI, MANAGEMENT, METRIC, NORMAN, POD
} from '@shell/config/types';
import { parseSi } from '@shell/utils/units';

import SteveModel from '@shell/plugins/steve/steve-class';
import { LOCAL } from '@shell/config/query-params';
import { PaginationArgs, PaginationParamFilter } from '@shell/types/store/pagination.types';

// Prefix of the saved count of running pods on a node, see `glancePodConsumedUsage`
const RUNNING_PODS_COUNT = 'nodeRunningPods';

export default class ClusterNode extends SteveModel {
  get _availableActions() {
    const normanAction = this.norman?.actions || {};

    const cordon = {
      action:   'cordon',
      enabled:  !!normanAction.cordon,
      icon:     'icon icon-pause',
      label:    'Cordon',
      total:    1,
      bulkable: true
    };

    const uncordon = {
      action:   'uncordon',
      enabled:  !!normanAction.uncordon,
      icon:     'icon icon-play',
      label:    'Uncordon',
      total:    1,
      bulkable: true
    };

    const drain = {
      action:     'drain',
      enabled:    !!normanAction.drain,
      icon:       'icon icon-dot-open',
      label:      this.t('drainNode.action'),
      bulkable:   true,
      bulkAction: 'drain'
    };

    const stopDrain = {
      action:   'stopDrain',
      enabled:  !!normanAction.stopDrain,
      icon:     'icon icon-x',
      label:    this.t('drainNode.actionStop'),
      bulkable: true,
    };

    const openSsh = {
      action:  'openSsh',
      enabled: !!this.provisionedMachine?.links?.shell,
      icon:    'icon icon-chevron-right',
      label:   'SSH Shell',
    };

    const downloadKeys = {
      action:  'downloadKeys',
      enabled: !!this.provisionedMachine?.links?.sshkeys,
      icon:    'icon icon-download',
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
    // Pass in the name of the node, so we display that rather than the name of the provisioned machine
    this.provisionedMachine.openSsh(this.nameDisplay);
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

  get addresses() {
    return this.status?.addresses || [];
  }

  get internalIps() {
    return this.addresses.filter((address) => address.type === 'InternalIP').map((address) => address.address);
  }

  get externalIps() {
    const annotationAddress = this.metadata.annotations[RKE.EXTERNAL_IP];
    const statusAddresses = this.addresses.filter((address) => address.type === 'ExternalIP').map((address) => address.address);

    return statusAddresses.concat(annotationAddress || []);
  }

  get internalIp() {
    return this.internalIps[0];
  }

  get externalIp() {
    return this.externalIps[0];
  }

  get labels() {
    return this.metadata?.labels || {};
  }

  get customLabelCount() {
    return this.customLabels.length;
  }

  get customLabels() {
    const parsedLabels = [];

    if (this.labels) {
      for (const k in this.labels) {
        const [prefix] = k.split('/');

        if (!SYSTEM_LABELS.includes(prefix)) {
          parsedLabels.push(`${ k }=${ this.labels[k] }`);
        }
      }
    }

    return parsedLabels;
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

  get cpuAllocatable() {
    return parseSi(this.status?.allocatable?.cpu || '0');
  }

  get cpuCapacity() {
    return parseSi(this.status?.capacity?.cpu || '0');
  }

  get cpuUsagePercentage() {
    return ((this.cpuUsage * 100) / this.cpuAllocatable).toString();
  }

  get ramUsage() {
    if ( this.isFromNorman && this.provider === 'eks' ) {
      return parseSi(this.podRequests.memory || '0');
    }

    return parseSi(this.$rootGetters['cluster/byId'](METRIC.NODE, this.id)?.usage?.memory || '0');
  }

  get ramCapacity() {
    return parseSi(this.status.capacity?.memory);
  }

  get ramUsagePercentage() {
    return ((this.ramUsage * 100) / this.ramCapacity).toString();
  }

  get ramAllocatable() {
    return parseSi(this.status?.allocatable?.memory);
  }

  get ramReserved() {
    return parseSi(this.podRequests?.memory || '0');
  }

  get cpuReserved() {
    return parseSi(this.podRequests?.cpu || '0');
  }

  get podReserved() {
    return parseSi(this.podRequests?.pods || '0');
  }

  get systemReservedRam() {
    return Math.max(this.ramCapacity - this.ramAllocatable, 0);
  }

  get systemReservedCpu() {
    return Math.max(this.cpuCapacity - this.cpuAllocatable, 0);
  }

  get podUsage() {
    return calculatePercentage(this.status.allocatable?.pods, this.status.capacity?.pods);
  }

  get podConsumedUsage() {
    return ((this.podConsumed / this.podCapacity) * 100).toString();
  }

  get podCapacity() {
    return parseSi(this.status.capacity?.pods);
  }

  get podConsumed() {
    const runningPods = this.pods.filter((pod) => pod.state === 'running');

    return runningPods.length || 0;
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

  get isSchedulable() {
    return !this.spec.unschedulable;
  }

  get drainedState() {
    const sNodeCondition = this.managementNode?.status.conditions.find((c) => c.type === 'Drained');

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
    this.$dispatch('promptModal', {
      component:      'DrainNode',
      componentProps: {
        kubeNodes:    resources || [this],
        normanNodeId: this.normanNodeId
      }
    });
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

  get glance() {
    const glance = [...this._glance];

    // Nodes aren't namespaced
    const namespaceIndex = glance.findIndex((item) => item.name === 'namespace');

    if (namespaceIndex > -1) {
      glance.splice(namespaceIndex, 1);
    }

    const rows = [
      ipGlanceRow('externalIp', this.t('component.resource.detail.glance.externalIp'), this.externalIp),
      ipGlanceRow('internalIp', this.t('component.resource.detail.glance.internalIp'), this.internalIp),
      {
        name:    'version',
        label:   this.t('component.resource.detail.glance.version'),
        content: this.version || '—'
      },
      {
        name:    'os',
        label:   this.t('component.resource.detail.glance.os'),
        content: this.status?.nodeInfo?.osImage || '—'
      },
    ];

    const ageIndex = glance.findIndex((item) => item.name === 'age');

    glance.splice(ageIndex > -1 ? ageIndex : glance.length, 0, ...rows);

    return glance;
  }

  /**
   * CPU, memory and pods usage, shown below the rows of the node's popover card. Usage without a percentage is shown as unavailable
   */
  get glanceUsage() {
    return [
      {
        name:       'cpu',
        label:      this.t('component.resource.detail.glance.cpu'),
        percentage: listPercentage(this.cpuUsagePercentage)
      },
      {
        name:       'memory',
        label:      this.t('component.resource.detail.glance.memory'),
        percentage: listPercentage(this.ramUsagePercentage)
      },
      {
        name:       'pods',
        label:      this.t('component.resource.detail.glance.pods'),
        percentage: listPercentage(this.glancePodConsumedUsage)
      },
    ];
  }

  /**
   * The same as podConsumedUsage, which the Nodes list shows. The pods in the store are only counted when every pod is loaded,
   * otherwise the running pods on the node are counted by the API, see `fetchRunningPods`
   */
  get glancePodConsumedUsage() {
    if (this.hasAllPods) {
      return this.podConsumedUsage;
    }

    const running = this.$rootGetters['cluster/getSavedCount'](this.runningPodsCountName);

    return running === undefined ? undefined : ((running / this.podCapacity) * 100).toString();
  }

  /**
   * Every pod of the cluster is in the store, e.g. the Nodes list loaded them, so the running pods on the node can be counted there
   */
  get hasAllPods() {
    return !this.$rootGetters['cluster/paginationEnabled'](POD) && !!this.$rootGetters['cluster/haveAll'](POD);
  }

  /**
   * Saved counts are kept when the user changes cluster, so the name includes the cluster
   */
  get runningPodsCountName() {
    return `${ RUNNING_PODS_COUNT }/${ this.$rootGetters['clusterId'] }/${ this.id }`;
  }

  /**
   * Fetch what the node's popover card shows besides the node: its metrics, for CPU and memory usage, and its running pods
   */
  async fetchGlanceResources() {
    const promises = [];

    if (this.$rootGetters['cluster/schemaFor'](METRIC.NODE)) {
      // Metrics can't be watched, the card fetches them each time it opens
      promises.push(this.$dispatch('cluster/find', {
        type: METRIC.NODE,
        id:   this.id,
        opt:  { force: true, watch: false }
      }, { root: true }));
    }

    if (this.$rootGetters['cluster/schemaFor'](POD)) {
      promises.push(this.fetchRunningPods());
    }

    // Wait for every request, so the card only stops loading once it has all it can show
    const failed = (await Promise.allSettled(promises)).find((result) => result.status === 'rejected');

    if (failed) {
      throw failed.reason;
    }
  }

  /**
   * Count the running pods on the node, the same way the Nodes list does, without storing the pods
   */
  async fetchRunningPods() {
    if (this.hasAllPods) {
      return;
    }

    try {
      if (this.$rootGetters['cluster/paginationEnabled'](POD)) {
        // It isn't stored as a page of pods, which would replace e.g. the page shown by the Pods list
        await this.$dispatch('cluster/findPage', {
          type: POD,
          opt:  {
            transient:   true,
            saveCountAs: this.runningPodsCountName,
            pagination:  new PaginationArgs({
              page:     1,
              pageSize: 1,
              filters:  [
                PaginationParamFilter.createSingleField({ field: 'spec.nodeName', value: this.id }),
                PaginationParamFilter.createSingleField({ field: 'metadata.state.name', value: 'running' }),
              ]
            })
          }
        }, { root: true });

        return;
      }

      // A one-off request rather than loading every pod of the cluster into the store. Steve only returns the pods the user can
      // see, like the Nodes list. Without the SQL cache the filter matches part of the name, so the node is checked again here
      const collectionUrl = this.$rootGetters['cluster/urlFor'](POD);
      const url = `${ collectionUrl }${ collectionUrl.includes('?') ? '&' : '?' }filter=spec.nodeName=${ encodeURIComponent(this.name) }`;
      const res = await this.$dispatch('cluster/request', { url }, { root: true });
      const running = (res?.data || []).filter((pod) => pod.spec?.nodeName === this.name && pod.metadata?.state?.name === 'running');

      this.saveRunningPodsCount(running.length);
    } catch (e) {
      // Show the count as unknown rather than an old one
      this.saveRunningPodsCount(undefined);

      throw e;
    }
  }

  saveRunningPodsCount(count) {
    this.$ctx.commit('cluster/setSavedCount', { name: this.runningPodsCountName, count }, { root: true });
  }

  get pods() {
    // This fetches all pods that are in the store, rather than all pods in the cluster
    const allPods = this.$rootGetters['cluster/all'](POD);

    return allPods.filter((pod) => pod.spec.nodeName === this.name);
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

  get displayTaintsAndLabels() {
    return !!this.spec.taints?.length || !!this.customLabelCount;
  }
}

/**
 * A glance row for an IP address that can be copied, or a dash when the node doesn't have one
 */
function ipGlanceRow(name, label, ip) {
  return {
    name,
    label,
    formatter: ip ? 'CopyToClipboard' : undefined,
    content:   ip || '—'
  };
}

/**
 * Parse a usage percentage the Nodes list shows. Like the list, 0 is shown as unavailable, e.g. there are no metrics for the node
 */
function listPercentage(value) {
  const percentage = Number.parseFloat(value);

  return Number.isFinite(percentage) && percentage > 0 ? percentage : undefined;
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
