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
        <label><t k="infoBoxCluster.provider" />: </label>
        {{ cluster.displayProvider }}
      </div>
      <div class="info-row">
        <label><t k="infoBoxCluster.version" />: </label>
        {{ cluster.kubernetesVersion }}
      </div>
      <div class="info-row">
        <label><t k="infoBoxCluster.created" />: </label>
        <LiveDate :value="cluster.metadata.creationTimestamp" />
      </div>
    </div>
    <div class="col span-3 info-column">
      <label class="mb-10"><t k="infoBoxCluster.cpu" />: </label>
      <div class="container-flex">
        <div class="flex-item-half usage">
          <label>
            <t
              k="infoBoxCluster.reserved"
              :numerator="nodeUsageReserved.nodeUsage"
              :denominator="nodeUsageReserved.clusterCapacity"
            />
          </label>
        </div>
        <div class="flex-item-half">
          <PercentageBar :value="nodeUsageReserved.percentage" />
        </div>
      </div>
      <div class="container-flex">
        <div class="flex-item-half usage">
          <label>
            <t
              k="infoBoxCluster.used"
              :numerator="liveNodeUsage.nodeUsage"
              :denominator="liveNodeUsage.clusterCapacity"
            />
          </label>
        </div>
        <div class="flex-item-half">
          <PercentageBar :value="liveNodeUsage.percentage" />
        </div>
      </div>
    </div>
    <div class="col span-3 info-column">
      <label class="mb-10"><t k="infoBoxCluster.memory" />: </label>
      <div class="container-flex">
        <div class="flex-item-half usage">
          <label>
            <t
              k="infoBoxCluster.reserved"
              :numerator="nodeUsageMemReserved.nodeUsage"
              :denominator="nodeUsageMemReserved.clusterCapacity"
            />
          </label>
        </div>
        <div class="flex-item-half">
          <PercentageBar :value="nodeUsageMemReserved.percentage" />
        </div>
      </div>
      <div class="container-flex">
        <div class="flex-item-half usage">
          <label>
            <t
              k="infoBoxCluster.used"
              :numerator="liveNodeMemUsage.nodeUsage"
              :denominator="liveNodeMemUsage.clusterCapacity"
            />
          </label>
        </div>
        <div class="flex-item-half">
          <PercentageBar :value="liveNodeMemUsage.percentage" />
        </div>
      </div>
    </div>
    <div class="col span-3 info-column">
      <label class="mb-10"><t k="infoBoxCluster.pods" />: </label>
      <div class="container-flex">
        <div class="flex-item-half usage">
          <label>
            <t
              k="infoBoxCluster.reserved"
              :numerator="nodeUsagePodReserved.nodeUsage"
              :denominator="nodeUsagePodReserved.clusterCapacity"
            />
          </label>
        </div>
        <div class="flex-item-half">
          <PercentageBar :value="nodeUsagePodReserved.percentage" />
        </div>
      </div>
    </div>
  </InfoBox>
</template>
