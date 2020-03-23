import { formatPercent } from '@/utils/string';
import { NODE_ROLES } from '@/config/labels-annotations.js';

export default {
  name() {
    return this.metadata.name;
  },

  roles() {
    const {
      CONTROL_PLANE: controlPlane,
      WORKER:        worker,
      ETCD:          etcd
    } = NODE_ROLES;
    const labels = this.metadata?.labels;

    const isControlPlane = labels[controlPlane];
    const isWorker = labels[worker];
    const isEtcd = labels[etcd];

    if (( isControlPlane && isWorker && isEtcd ) ||
        ( !isControlPlane && !isWorker && !isEtcd )) {
      // !isControlPlane && !isWorker && !isEtcd === RKE?
      return 'All';
    }
    // worker+cp, worker+etcd, cp+etcd

    if (isControlPlane && isWorker) {
      return 'Control Plane & Worker';
    }

    if (isControlPlane && isEtcd) {
      return 'Control Plane & Etcd';
    }

    if (isEtcd && isWorker) {
      return 'Etcd & Worker';
    }

    if (isControlPlane) {
      return 'Control Plane';
    }

    if (isEtcd) {
      return 'Etcd';
    }

    if (isWorker) {
      return 'Worker';
    }
  },

  version() {
    return this.status.nodeInfo.kubeletVersion;
  },

  cpuUsage() {
    return calculatePercentage(this.status.allocatable.cpu, this.status.capacity.cpu);
  },

  cpuCapacity() {
    return Number.parseInt(this.status.capacity.cpu);
  },

  cpuConsumed() {
    return Number.parseInt(this.status.capacity.cpu) - Number.parseInt(this.status.allocatable.cpu);
  },

  ramUsage() {
    return calculatePercentage(this.status.allocatable.memory, this.status.capacity.memory);
  },

  ramCapacity() {
    return Number.parseInt(this.status.capacity.memory);
  },

  ramConsumed() {
    return Number.parseInt(this.status.capacity.memory) - Number.parseInt(this.status.allocatable.memory);
  },

  podUsage() {
    return calculatePercentage(this.status.allocatable.pods, this.status.capacity.pods);
  },

  podCapacity() {
    return Number.parseInt(this.status.capacity.pods);
  },

  podConsumed() {
    return Number.parseInt(this.status.capacity.pods) - Number.parseInt(this.status.allocatable.pods);
  },

  isPidPressureOk() {
    return this.hasCondition('PIDPressure', 'False');
  },

  isDiskPressureOk() {
    return this.hasCondition('DiskPressure', 'False');
  },

  isMemoryPressureOk() {
    return this.hasCondition('MemoryPressure', 'False');
  },

  isKubeletOk() {
    return this.hasCondition('Ready');
  }
};

function calculatePercentage(allocatable, capacity) {
  const c = Number.parseFloat(capacity);
  const a = Number.parseFloat(allocatable);
  const percent = (((c - a) / c) * 100);

  return formatPercent(percent);
}
