<script>
import { isEmpty } from 'lodash';
import InfoBox from '@/components/InfoBox';
import PercentageBar from '@/components/PercentageBar';
import { parseSi, formatSi } from '@/utils/units';

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

      return this.getUsage(clusterCapacityCpu, 'cpu');
    },

    nodeUsageReserved() {
      const allocatableCpu = this.cluster?.status?.allocatable?.cpu;

      return this.getUsage(allocatableCpu, 'cpu');
    },

    liveNodeMemUsage() {
      const clusterCapacityMemory = this.cluster?.status?.capacity?.memory;

      return this.getUsage(clusterCapacityMemory, 'memory');
    },

    nodeUsageMemReserved() {
      const allocatableMem = this.cluster?.status?.allocatable?.memory;

      return this.getUsage(allocatableMem, 'memory');
    },

    nodeUsagePodReserved() {
      const podCapacity = parseSi(this.cluster?.status?.allocatable?.pods || 0);
      const podUsage = parseSi(this.cluster?.status?.requested?.pods || 0);

      return {
        clusterCapacity: formatSi(podCapacity),
        nodeUsage:       formatSi(podUsage),
        percentage:      podCapacity === 0 ? 0 : ( podUsage * 100 ) / podCapacity,
      };
    },
  },

  methods: {
    getUsage(capacity = 0, field = 'cpu') {
      const metrics = this.metrics;
      const normalizedCapacity = parseSi(capacity);
      const nodesEachUsage = metrics.map( m => parseSi(m.usage[field]));
      const cumulativeUsage = isEmpty(nodesEachUsage) ? 0 : nodesEachUsage.reduce( ( acc, cv ) => acc + cv);
      let formatedCapacity = formatSi(capacity);

      if (isNaN(formatedCapacity)) {
        formatedCapacity = formatSi(parseSi(capacity));
      }

      return {
        clusterCapacity: formatedCapacity,
        nodeUsage:       formatSi(cumulativeUsage),
        percentage:      normalizedCapacity === 0 ? normalizedCapacity : ( cumulativeUsage * 100 ) / normalizedCapacity,
      };
    },
  }
};
</script>

<template>
  <InfoBox class="row">
    <div class="col span-3 info-column">
      <div class="info-row">
        <label><t k="infoBoxCluster.provider" /></label>
        <br/>
        {{ cluster.displayProvider }}
      </div>
      <div class="info-row">
        <label><t k="infoBoxCluster.version" /></label>
        <br/>
        {{ cluster.kubernetesVersion }}
      </div>
      <div class="info-row">
        <label><t k="infoBoxCluster.created" /></label>
        <br/>
        <LiveDate :value="cluster.metadata.creationTimestamp" />
      </div>
    </div>
    <div class="col span-3 info-column">
      <label class="mb-10"><t k="infoBoxCluster.cpu" /></label>
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
      <label class="mb-10"><t k="infoBoxCluster.memory" /></label>
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
      <label class="mb-10"><t k="infoBoxCluster.pods" /></label>
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
