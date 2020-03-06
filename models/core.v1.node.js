import { formatPercent } from '@/utils/string';

export default {
  name() {
    return this.metadata.name;
  },

  roles() {
    console.warn('no backend for roles');

    return 'All';
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
