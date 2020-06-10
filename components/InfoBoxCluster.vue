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
    /**
     * The cluster for info
     */
    cluster: {
      type:     Object,
      required: true,
    },
    /**
     * The node metrics used for parsing CPU/MEM graphs
     */
    metrics: {
      type:     Array,
      required: true,
    },
    /**
     * The nodes belonging to this cluster
     */
    nodes: {
      type:     Array,
      required: true,
      default:  () => [],
    },
  },

  computed: {
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
      const increment = formatOpts?.increment ? formatOpts.increment : undefined; // exponentneeded has default for incremeent if not defined

      formatOpts = {
        ...formatOpts,
        ...{
          maxExponent:      exponentNeeded(parsed.allocatable, increment),
          minExponent:      exponentNeeded(parsed.allocatable, increment),
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
      const increment = formatOpts?.increment ? formatOpts.increment : 1024;

      if (field === 'memory') {
        formatOpts = {
          ...formatOpts,
          ...{
            maxExponent: exponentNeeded(normalizedCapacity, increment),
            minExponent: exponentNeeded(normalizedCapacity, increment),
            increment,
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
  <InfoBox>
    <div class="info-column">
      <label>
        <h5>
          <t k="infoBoxCluster.cpu" />
        </h5>
      </label>
      <div class="info-column-data mb-10">
        <label>
          <t
            k="infoBoxCluster.reserved"
            :numerator="nodeUsageReserved.requested"
            :denominator="nodeUsageReserved.allocatable"
          />
        </label>
        <PercentageBar :value="nodeUsageReserved.percentage" />
      </div>
      <div class="info-column-data">
        <label>
          <t
            k="infoBoxCluster.used"
            :numerator="liveNodeUsage.nodeUsage"
            :denominator="liveNodeUsage.clusterCapacity"
          />
        </label>
        <PercentageBar :value="liveNodeUsage.percentage" />
      </div>
    </div>
    <div class="info-column">
      <label>
        <h5>
          <t k="infoBoxCluster.memory" />
        </h5>
      </label>
      <div class="info-column-data mb-10">
        <label>
          <t
            k="infoBoxCluster.reserved"
            :numerator="nodeUsageMemReserved.requested"
            :denominator="nodeUsageMemReserved.allocatable"
          />
        </label>
        <PercentageBar :value="nodeUsageMemReserved.percentage" />
      </div>
      <div class="info-column-data">
        <label>
          <t
            k="infoBoxCluster.used"
            :numerator="liveNodeMemUsage.nodeUsage"
            :denominator="liveNodeMemUsage.clusterCapacity"
          />
        </label>
        <PercentageBar :value="liveNodeMemUsage.percentage" />
      </div>
    </div>
    <div class="info-column">
      <label>
        <h5>
          <t k="infoBoxCluster.pods" />
        </h5>
      </label>
      <div class="info-column-data mb-10">
        <label>
          <t
            k="infoBoxCluster.reserved"
            :numerator="nodeUsagePodReserved.nodeUsage"
            :denominator="nodeUsagePodReserved.clusterCapacity"
          />
        </label>
        <PercentageBar :value="nodeUsagePodReserved.percentage" />
      </div>
    </div>
  </InfoBox>
</template>

<style lang="scss" scoped>
  .info-box {
    // reset infobox flex styles
    display: grid;
    grid-template-columns: 1fr;
    flex-grow: 0;
    flex-basis: 0;
    margin-bottom: 20px;

    .info-column {
      padding-left: 10%;
      &:not(:last-child) {
        border-right: 0;
        border-bottom: 1px solid var(--tabbed-border);
        margin-bottom: 10px;
      }
      .info-column-data {
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: center;
      }
      > label {
        margin-bottom: 5px;
        display: inline-block;
      }
    }
  }

  @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
    .info-box {
      grid-template-columns: 1fr 1fr 1fr;
      .info-column {
        .info-column-data {
          grid-template-columns: 1fr 1fr;
        }
        &:not(:last-child) {
          border-right: 1px solid var(--tabbed-border);
          border-bottom: 0;
          margin-bottom: 0;
        }
      }
    }
  }
</style>
