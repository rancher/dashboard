<script>
import { isEmpty } from 'lodash';
import InfoBox from '@/components/InfoBox';
import PercentageBar from '@/components/PercentageBar';
import Units from '@/utils/units';

export default {
  components: {
    InfoBox,
    PercentageBar,
  },

  props: {
    cluster: {
      type:     Object,
      required: true,
    },
    metrics: {
      type:     Array,
      required: true,
    }
  },

  computed: {
    liveNodeUsage() {
      const clusterCapacityCpu = this.cluster?.status?.capacity?.cpu;

      return this.getUsage(clusterCapacityCpu, Units.parseSi(clusterCapacityCpu), this.metrics, 'cpu');
    },

    nodeUsageReserved() {
      const allocatableCpu = this.cluster?.status?.allocatable?.cpu;

      return this.getUsage(allocatableCpu, Units.parseSi(allocatableCpu), this.metrics, 'cpu');
    },

    liveNodeMemUsage() {
      let clusterCapacityMemory = this.cluster?.status?.capacity?.memory;

      clusterCapacityMemory = Units.parseSi(clusterCapacityMemory);

      return this.getUsage(clusterCapacityMemory, clusterCapacityMemory, this.metrics, 'memory');
    },

    nodeUsageMemReserved() {
      let allocatableMem = this.cluster?.status?.allocatable?.memory;

      allocatableMem = Units.parseSi(allocatableMem);

      return this.getUsage(allocatableMem, allocatableMem, this.metrics, 'memory');
    },

    nodeUsagePodReserved() {
      const podCapacity = Units.parseSi(this.cluster?.status?.allocatable?.pods || 0);
      const podUsage = Units.parseSi(this.cluster?.status?.requested?.pods || 0);

      return {
        clusterCapacity: Units.formatSi(podCapacity),
        nodeUsage:       Units.formatSi(podUsage),
        percentage:      ( podUsage * 100 ) / podCapacity,
      };
    },
  },

  methods: {
    getUsage(clusterCapacityCpu = 0, normalizedCpu = 0, metrics = [], field = 'cpu') {
      const nodeCpuUsage = metrics.map( m => Units.parseSi(m.usage[field]));
      const nodesCpuUsage = isEmpty(nodeCpuUsage) ? 0 : nodeCpuUsage.reduce( ( acc, cv ) => acc + cv);

      return {
        clusterCapacity: Units.formatSi(clusterCapacityCpu),
        nodeUsage:       Units.formatSi(nodesCpuUsage),
        percentage:      ( nodesCpuUsage * 100 ) / normalizedCpu,
      };
    },
  }
};
</script>

<template>
  <InfoBox class="row">
    <div class="col span-3 info-column">
      <div class="info-row">
        <label>Provider: </label>
        {{ cluster.displayProvider }}
      </div>
      <div class="info-row">
        <label>Kubernetes Version: </label>
        {{ cluster.kubernetesVersion }}
      </div>
      <div class="info-row">
        <label>Created: </label>
        {{ cluster.createdDisplay }}
      </div>
    </div>
    <div class="col span-3 info-column">
      <label class="mb-10">CPU Usage: </label>
      <div class="container-flex">
        <div class="flex-item-half usage">
          <label>{{ nodeUsageReserved.nodeUsage }} of {{ nodeUsageReserved.clusterCapacity }} Reserved</label>
        </div>
        <div class="flex-item-half">
          <PercentageBar :value="nodeUsageReserved.percentage" />
        </div>
      </div>
      <div class="container-flex">
        <div class="flex-item-half usage">
          <label>{{ liveNodeUsage.nodeUsage }} of {{ liveNodeUsage.clusterCapacity }} Used</label>
        </div>
        <div class="flex-item-half">
          <PercentageBar :value="liveNodeUsage.percentage" />
        </div>
      </div>
    </div>
    <div class="col span-3 info-column">
      <label class="mb-10">Memory: </label>
      <div class="container-flex">
        <div class="flex-item-half usage">
          <label>{{ nodeUsageMemReserved.nodeUsage }} of {{ nodeUsageMemReserved.clusterCapacity }} Reserved</label>
        </div>
        <div class="flex-item-half">
          <PercentageBar :value="nodeUsageMemReserved.percentage" />
        </div>
      </div>
      <div class="container-flex">
        <div class="flex-item-half usage">
          <label>{{ liveNodeMemUsage.nodeUsage }} of {{ liveNodeMemUsage.clusterCapacity }} Used</label>
        </div>
        <div class="flex-item-half">
          <PercentageBar :value="liveNodeMemUsage.percentage" />
        </div>
      </div>
    </div>
    <div class="col span-3 info-column">
      <label class="mb-10">Pods: </label>
      <div class="container-flex">
        <div class="flex-item-half usage">
          <label>{{ nodeUsagePodReserved.nodeUsage }} of {{ nodeUsagePodReserved.clusterCapacity }} Reserved</label>
        </div>
        <div class="flex-item-half">
          <PercentageBar :value="nodeUsagePodReserved.percentage" />
        </div>
      </div>
    </div>
  </InfoBox>
</template>
