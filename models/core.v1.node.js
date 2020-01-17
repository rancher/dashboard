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
    return calculatePercentage(this.status.capacity.cpu, this.status.allocatable.cpu);
  },
  cpuCapacity() {
    return Number.parseInt(this.status.capacity.cpu);
  },
  cpuConsumed() {
    return Number.parseInt(this.status.capacity.cpu) - Number.parseInt(this.status.allocatable.cpu);
  },
  ramUsage() {
    return calculatePercentage(this.status.capacity.memory, this.status.allocatable.memory);
  },
  ramCapacity() {
    return Number.parseInt(this.status.capacity.memory);
  },
  ramConsumed() {
    return Number.parseInt(this.status.capacity.memory) - Number.parseInt(this.status.allocatable.memory);
  },
  podUsage() {
    return calculatePercentage(this.status.capacity.pods, this.status.allocatable.pods);
  },
  podCapacity() {
    return Number.parseInt(this.status.capacity.pods);
  },
  podConsumed() {
    return Number.parseInt(this.status.capacity.pods) - Number.parseInt(this.status.allocatable.pods);
  },
  isPidPressureOk() {
    return isConditionOk(this, 'PIDPressure');
  },
  isDiskPressureOk() {
    return isConditionOk(this, 'DiskPressure');
  },
  isMemoryPressureOk() {
    return isConditionOk(this, 'MemoryPressure');
  },
  isKubeletOk() {
    return !isConditionOk(this, 'Ready');
  }
};

function isConditionOk(that, type) {
  const condition = that.status.conditions.find(condition => condition.type === type);

  return condition.status === 'False';
}

function calculatePercentage(capacity, allocatable) {
  const c = Number.parseFloat(capacity);
  const a = Number.parseFloat(allocatable);

  return (((c - a) / c) * 100).toString();
}
