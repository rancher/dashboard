<script>
import { isEmpty } from 'lodash';
import InfoBox from '@/components/InfoBox';
import PercentageBar from '@/components/PercentageBar';
import { parseSi, formatSi, exponentNeeded } from '@/utils/units';

const PARSE_RULES = {
  memory: {
    format: {
      addSuffix:        true,
      firstSuffix:      'B',
      increment:        1000,
      maxExponent:      99,
      maxPrecision:     2,
      minExponent:      0,
      startingExponent: 0,
      suffix:           'iB',
    }
  }
};

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
    },
    nodes: {
      type:     Array,
      required: true,
      default:  () => [],
    }
  },

  computed: {
    nodeCounts() {
      const nodes = this.nodes;
      const countsOut = {
        workerNodes:       nodes.filter(n => n.isWorker).length || 0,
        etcdNodes:         nodes.filter(n => n.isEtcd).length || 0,
        controlPlaneNodes: nodes.filter(n => n.isControlPlane).length || 0,
      };

      return countsOut;
    },

    liveNodeUsage() {
      const clusterCapacityCpu = this.cluster?.status?.capacity?.cpu;

      return this.getLiveUsage(clusterCapacityCpu, 'cpu');
    },

    liveNodeMemUsage() {
      const clusterCapacityMemory = this.cluster?.status?.capacity?.memory;
      const { memory: { format } } = PARSE_RULES;

      return this.getLiveUsage(clusterCapacityMemory, 'memory', format);
    },

    nodeUsageReserved() {
      const requested = this.cluster?.status?.requested?.cpu;
      const allocatable = this.cluster?.status?.allocatable?.cpu;

      return this.getReservedUsage(requested, allocatable);
    },

    nodeUsageMemReserved() {
      const requested = this.cluster?.status?.requested?.memory;
      const allocatable = this.cluster?.status?.allocatable?.memory;
      const { memory: { format } } = PARSE_RULES;

      format.increment = 1024;

      return this.getReservedUsage(requested, allocatable, format);
    },

    nodeUsagePodReserved() {
      const { memory: { format } } = PARSE_RULES;
      const podCapacity = parseSi(this.cluster?.status?.allocatable?.pods || 0);
      const podUsage = parseSi(this.cluster?.status?.requested?.pods || 0);

      return {
        clusterCapacity: formatSi(podCapacity, { ...format, ...{ addSuffix: false } }),
        nodeUsage:       formatSi(podUsage, { ...format, ...{ addSuffix: false } }),
        percentage:      podCapacity === 0 ? 0 : ( podUsage * 100 ) / podCapacity,
      };
    },
  },

  methods: {
    getReservedUsage(requested = 0, allocatable = 0, formatOpts = {}) {
      const parsed = {
        requested:   parseSi(requested),
        allocatable: parseSi(allocatable),
      };
      const percentage = parsed.allocatable === 0 ? parsed.allocatable : ( parsed.requested * 100 ) / parsed.allocatable;

      formatOpts = {
        ...formatOpts,
        ...{
          maxExponent:      exponentNeeded(parsed.allocatable),
          minExponent:      exponentNeeded(parsed.allocatable),
        }
      };

      return {
        requested:   formatSi(parsed.requested, { ...formatOpts, ...{ addSuffix: false } }),
        allocatable: formatSi(parsed.allocatable, formatOpts),
        percentage
      };
    },

    getLiveUsage(capacity, field = 'cpu', formatOpts = {}) {
      const nodes = this.nodes;
      const metrics = this.metrics.filter(n => nodes.find(nd => nd.id === n.id && nd.isWorker));
      const normalizedCapacity = parseSi(capacity);
      const nodesEachUsage = metrics.map( m => parseSi(m.usage[field]));
      const cumulativeUsage = isEmpty(nodesEachUsage) ? 0 : nodesEachUsage.reduce( ( acc, cv ) => acc + cv);

      if (field === 'memory') {
        formatOpts = {
          ...formatOpts,
          ...{
            maxExponent: exponentNeeded(normalizedCapacity),
            minExponent: exponentNeeded(normalizedCapacity),
            increment:   1024,
          }
        };
      }

      const formatedCapacity = formatSi(normalizedCapacity, formatOpts);
      const formatedUsage = formatSi(cumulativeUsage, { ...formatOpts, ...{ addSuffix: false } });
      const percentage = normalizedCapacity === 0 ? normalizedCapacity : ( cumulativeUsage * 100 ) / normalizedCapacity;

      return {
        clusterCapacity: formatedCapacity,
        nodeUsage:       formatedUsage,
        percentage,
      };
    },
  }
};
</script>

<template>
  <InfoBox class="row">
    <div class="col span-3 info-column">
      <div class="info-row">
        <label class="info-row-label">
          <t k="infoBoxCluster.provider" />
        </label>
        <div>
          {{ cluster.displayProvider }}
        </div>
      </div>
      <div class="info-row">
        <label class="info-row-label">
          <t k="infoBoxCluster.version" />
        </label>
        <div>
          {{ cluster.kubernetesVersion }}
        </div>
      </div>
      <div class="info-row">
        <label class="info-row-label">
          <t k="infoBoxCluster.created" />
        </label>
        <div>
          <LiveDate
            :value="cluster.metadata.creationTimestamp"
            :add-suffix="true"
          />
        </div>
      </div>
    </div>
    <div class="col span-3 info-column">
      <label class="mb-10"><t k="infoBoxCluster.cpu" /></label>
      <div class="container-flex-center mb-10">
        <div class="flex-item-half">
          <label>
            <t
              k="infoBoxCluster.reserved"
              :numerator="nodeUsageReserved.requested"
              :denominator="nodeUsageReserved.allocatable"
            />
          </label>
        </div>
        <div class="flex-item-half flex-justify-start pl-5">
          <PercentageBar class="container-flex-center" :value="nodeUsageReserved.percentage" />
        </div>
      </div>
      <div class="container-flex-center mb-10">
        <div class="flex-item-half">
          <label>
            <t
              k="infoBoxCluster.used"
              :numerator="liveNodeUsage.nodeUsage"
              :denominator="liveNodeUsage.clusterCapacity"
            />
          </label>
        </div>
        <div class="flex-item-half flex-justify-start pl-5">
          <PercentageBar class="container-flex-center" :value="liveNodeUsage.percentage" />
        </div>
      </div>
    </div>
    <div class="col span-3 info-column">
      <label class="mb-10"><t k="infoBoxCluster.memory" /></label>
      <div class="container-flex-center mb-10">
        <div class="flex-item-half">
          <label>
            <t
              k="infoBoxCluster.reserved"
              :numerator="nodeUsageMemReserved.requested"
              :denominator="nodeUsageMemReserved.allocatable"
            />
          </label>
        </div>
        <div class="flex-item-half flex-justify-start pl-5">
          <PercentageBar class="container-flex-center" :value="nodeUsageMemReserved.percentage" />
        </div>
      </div>
      <div class="container-flex-center mb-10">
        <div class="flex-item-half">
          <label>
            <t
              k="infoBoxCluster.used"
              :numerator="liveNodeMemUsage.nodeUsage"
              :denominator="liveNodeMemUsage.clusterCapacity"
            />
          </label>
        </div>
        <div class="flex-item-half flex-justify-start pl-5">
          <PercentageBar class="container-flex-center" :value="liveNodeMemUsage.percentage" />
        </div>
      </div>
    </div>
    <div class="col span-3 info-column">
      <div>
        <label class="mb-10"><t k="infoBoxCluster.pods" /></label>
        <div class="container-flex-center mb-10">
          <div class="flex-item-half">
            <label>
              <t
                k="infoBoxCluster.reserved"
                :numerator="nodeUsagePodReserved.nodeUsage"
                :denominator="nodeUsagePodReserved.clusterCapacity"
              />
            </label>
          </div>
          <div class="flex-item-half flex-justify-start pl-5">
            <PercentageBar :value="nodeUsagePodReserved.percentage" />
          </div>
        </div>
      </div>
      <div class="container-flex-center mb-10">
        <div class="flex-item-half">
          <label>
            <t k="infoBoxCluster.nodes.worker.label" />:
          </label>
        </div>
        <div class="flex-item-half flex-justify-start pl-5">
          <span>
            {{ nodeCounts.workerNodes }}
          </span>
        </div>
      </div>
      <div class="container-flex-center mb-10">
        <div class="flex-item-half">
          <label>
            <t k="infoBoxCluster.nodes.etcd.label" />:
          </label>
        </div>
        <div class="flex-item-half flex-justify-start pl-5">
          <span>
            {{ nodeCounts.etcdNodes }}
          </span>
        </div>
      </div>
      <div class="container-flex-center mb-10">
        <div class="flex-item-half">
          <label>
            <t k="infoBoxCluster.nodes.controlPlane.label" />:
          </label>
        </div>
        <div class="flex-item-half flex-justify-start pl-5">
          <span>
            {{ nodeCounts.controlPlaneNodes }}
          </span>
        </div>
      </div>
    </div>
  </InfoBox>
</template>
