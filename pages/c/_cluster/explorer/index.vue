<script>
import Loading from '@/components/Loading';
import { mapGetters } from 'vuex';
import capitalize from 'lodash/capitalize';
import isEmpty from 'lodash/isEmpty';
import SortableTable from '@/components/SortableTable';
import { allHash } from '@/utils/promise';
import Poller from '@/utils/poller';
import { parseSi, formatSi, exponentNeeded, UNITS } from '@/utils/units';
import {
  MESSAGE,
  NAME,
  REASON,
  ROLES,
  STATE,
} from '@/config/table-headers';
import {
  NAMESPACE,
  INGRESS,
  EVENT,
  MANAGEMENT,
  METRIC,
  NODE,
  SERVICE,
  PV,
  WORKLOAD_TYPES
} from '@/config/types';
import SimpleBox from '@/components/SimpleBox';
import ResourceGauge, { resourceCounts } from '@/components/ResourceGauge';
import CountGauge from '@/components/CountGauge';
import Glance from '@/components/Glance';
import HardwareResourceGauge from './HardwareResourceGauge';

const PARSE_RULES = {
  memory: {
    format: {
      addSuffix:        true,
      firstSuffix:      'B',
      increment:        1024,
      maxExponent:      99,
      maxPrecision:     2,
      minExponent:      0,
      startingExponent: 0,
      suffix:           'iB',
    }
  }
};

const METRICS_POLL_RATE_MS = 30000;
const MAX_FAILURES = 2;

const RESOURCES = [NAMESPACE, INGRESS, PV, WORKLOAD_TYPES.DEPLOYMENT, WORKLOAD_TYPES.STATEFUL_SET, WORKLOAD_TYPES.JOB, WORKLOAD_TYPES.DAEMON_SET, SERVICE];

export default {
  components: {
    CountGauge,
    Loading,
    Glance,
    HardwareResourceGauge,
    ResourceGauge,
    SimpleBox,
    SortableTable
  },

  async fetch() {
    const hash = {
      nodes:       this.fetchClusterResources(NODE),
      events:      this.fetchClusterResources(EVENT),
    };

    if ( this.$store.getters['management/schemaFor'](MANAGEMENT.NODE_TEMPLATE) ) {
      hash.nodeTemplates = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
    }

    if ( this.$store.getters['management/schemaFor'](MANAGEMENT.NODE_POOL) ) {
      hash.nodePools = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
    }

    const res = await allHash(hash);

    for ( const k in res ) {
      this[k] = res[k];
    }
  },

  data() {
    const reason = {
      ...REASON,
      ...{ canBeVariable: true },
      width: 100
    };
    const message = { ...MESSAGE, ...{ canBeVariable: true } };
    const eventHeaders = [
      reason,
      {
        name:          'object',
        label:         'Object',
        value:         'displayInvolvedObject',
        sort:          ['involvedObject.kind', 'involvedObject.name'],
        canBeVariable: true,
        formatter:     'LinkDetail',
        width:         200
      },
      message,
      {
        align:         'right',
        name:          'date',
        label:         'Date',
        value:         'lastTimestamp',
        sort:          'lastTimestamp',
        formatter:     'LiveDate',
        formatterOpts: { addSuffix: true },
        width:         125
      },
    ];

    const nodeHeaders = [
      STATE,
      NAME,
      ROLES,
    ];

    return {
      metricPoller:  null,
      eventHeaders,
      nodeHeaders,
      constraints:       [],
      events:            [],
      nodeMetrics:       [],
      nodePools:         [],
      nodeTemplates:     [],
      nodes:             [],
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    displayProvider() {
      const cluster = this.currentCluster;
      const driver = cluster.status?.driver.toLowerCase();
      const customShortLabel = this.$store.getters['i18n/t']('cluster.provider.rancherkubernetesengine.shortLabel');

      if (driver && this.$store.getters['i18n/exists'](`cluster.provider.${ driver }.shortLabel`)) {
        if (driver === 'rancherkubernetesengine') {
          const pools = this.nodePools;
          const firstNodePool = pools.find(pool => pool.spec.clusterName === cluster.id);

          if (firstNodePool) {
            const nodeTemplateId = firstNodePool?.spec?.nodeTemplateName;
            const normalizedId = nodeTemplateId.split(':').join('/');
            const nodeTemplate = this.nodeTemplates.find(nt => nt.id === normalizedId);
            const nodeDriver = nodeTemplate?.spec?.driver || null;

            if (nodeDriver) {
              if (this.$store.getters['i18n/exists'](`cluster.nodeDriver.displayName.${ nodeDriver.toLowerCase() }`)) {
                return this.$store.getters['i18n/t'](`cluster.nodeDriver.displayName.${ nodeDriver.toLowerCase() }`);
              } else if (nodeTemplate?.spec?.diver) {
                return capitalize( nodeTemplate.spec.driver );
              }

              return customShortLabel;
            } else {
              // things are not good if we get here
              return customShortLabel;
            }
          }
        }

        return this.$store.getters['i18n/t'](`cluster.provider.${ driver }.shortLabel`);
      } else if (driver) {
        return capitalize(driver);
      } else {
        return this.$store.getters['i18n/t']('cluster.provider.imported.shortLabel');
      }
    },

    accessibleResources() {
      return RESOURCES.filter(resource => this.$store.getters['cluster/schemaFor'](resource));
    },

    totalCountGaugeInput() {
      const totalInput = {
        name:            this.t('clusterIndexPage.resourceGauge.totalResources'),
        location:        null,
        primaryColorVar: `--sizzle-${ this.accessibleResources.length }`,
        total:           0,
        useful:          0,
        warningCount:    0,
        errorCount:      0
      };

      this.accessibleResources.forEach((resource) => {
        const counts = resourceCounts(this.$store, resource);

        Object.entries(counts).forEach((entry) => {
          totalInput[entry[0]] += entry[1];
        });
      });

      return totalInput;
    },

    cpuReserved() {
      return {
        total:  parseSi(this.currentCluster?.status?.allocatable?.cpu),
        useful: parseSi(this.currentCluster?.status?.requested?.cpu)
      };
    },

    podsReserved() {
      return {
        total:  parseSi(this.currentCluster?.status?.allocatable?.pods || '0'),
        useful: parseSi(this.currentCluster?.status?.requested?.pods || '0')
      };
    },

    ramReserved() {
      return this.createMemoryValues(this.currentCluster?.status?.allocatable?.memory, this.currentCluster?.status?.requested?.memory);
    },

    metricAggregations() {
      const nodes = this.nodes;
      const someNonWorkerRoles = this.nodes.some(node => node.hasARole && !node.isWorker);
      const metrics = this.nodeMetrics.filter((nodeMetrics) => {
        const node = nodes.find(nd => nd.id === nodeMetrics.id);

        return node && (!someNonWorkerRoles || node.isWorker);
      });
      const initialAggregation = {
        cpu:    0,
        memory: 0
      };

      if (isEmpty(metrics)) {
        return null;
      }

      return metrics.reduce((agg, metric) => {
        agg.cpu += parseSi(metric.usage.cpu);
        agg.memory += parseSi(metric.usage.memory);

        return agg;
      }, initialAggregation);
    },

    cpuUsed() {
      return {
        total:  parseSi(this.currentCluster?.status?.capacity?.cpu),
        useful: this.metricAggregations?.cpu
      };
    },

    ramUsed() {
      return this.createMemoryValues(this.currentCluster?.status?.capacity?.memory, this.metricAggregations.memory);
    },

    showReservedMetrics() {
      // As long as we have at least one reserved value > 0 we should show these metrics
      const reservedSum = [this.cpuReserved, this.podsReserved, this.ramReserved].reduce((agg, cur) => {
        return agg + (cur.total || 0) + (cur.useful || 0);
      }, 0);

      return reservedSum > 0;
    },

    showLiveMetrics() {
      return this.cpuUsed.useful > 0 && this.cpuUsed.total > 0;
    }
  },

  mounted() {
    this.metricPoller = new Poller(this.loadMetrics, METRICS_POLL_RATE_MS, MAX_FAILURES);
    this.metricPoller.start();
  },

  methods: {
    createMemoryValues(total, useful) {
      const parsedTotal = parseSi((total || '0').toString());
      const parsedUseful = parseSi((useful || '0').toString());
      const format = this.createMemoryFormat(parsedTotal);
      const formattedTotal = formatSi(parsedTotal, format);
      const formattedUseful = formatSi(parsedUseful, format);

      return {
        total:  Number.parseFloat(formattedTotal),
        useful: Number.parseFloat(formattedUseful),
        units:  this.createMemoryUnits(parsedTotal)
      };
    },

    createMemoryFormat(n) {
      const exponent = exponentNeeded(n, PARSE_RULES.memory.format.increment);

      return {
        ...PARSE_RULES.memory.format,
        maxExponent: exponent,
        minExponent: exponent,
      };
    },

    createMemoryUnits(n) {
      const exponent = exponentNeeded(n, PARSE_RULES.memory.format.increment);

      return `${ UNITS[exponent] }${ PARSE_RULES.memory.format.suffix }`;
    },

    showActions() {
      this.$store.commit('action-menu/show', {
        resources: this.currentCluster,
        elem:      this.$refs['cluster-actions'],
      });
    },

    async fetchClusterResources(type, opt = {}) {
      const schema = this.$store.getters['cluster/schemaFor'](type);

      if (schema) {
        try {
          const resources = await this.$store.dispatch('cluster/findAll', { type, opt });

          return resources;
        } catch (err) {
          console.error(`Failed fetching cluster resource ${ type } with error:`, err); // eslint-disable-line no-console

          return [];
        }
      }

      return [];
    },

    async loadMetrics() {
      this.nodeMetrics = await this.fetchClusterResources(METRIC.NODE, { force: true } );
    },
  },

  beforeRouteLeave(to, from, next) {
    this.metricPoller.stop();
    next();
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <section v-else>
    <header class="row">
      <div class="span-11">
        <h1>
          <t k="clusterIndexPage.header" />
        </h1>
        <div>
          <span v-if="currentCluster.spec.description">{{ currentCluster.spec.description }}</span>
        </div>
      </div>
    </header>
    <Glance
      :slots="['displayProvider', 'kubernetesVersion', 'totalNodes', 'created']"
    >
      <template #displayProvider>
        <h1>{{ displayProvider }}</h1>
        <label>{{ t('glance.provider') }}</label>
      </template>
      <template #kubernetesVersion>
        <h1>{{ currentCluster.kubernetesVersion }}</h1>
        <label>{{ t('glance.version') }}</label>
      </template>
      <template #totalNodes>
        <h1>{{ (nodes || []).length }}</h1>
        <label>{{ t('glance.nodes.total.label', { count: (nodes || []).length }) }}</label>
      </template>
      <template #created>
        <h1><LiveDate :value="currentCluster.metadata.creationTimestamp" :add-suffix="true" :show-tooltip="true" /></h1>
        <label>{{ t('glance.created') }}</label>
      </template>
    </Glance>
    <div class="resource-gauges">
      <CountGauge v-bind="totalCountGaugeInput" />
      <ResourceGauge v-for="(resource, i) in accessibleResources" :key="resource" :resource="resource" :primary-color-var="`--sizzle-${i}`" />
    </div>
    <div v-if="showReservedMetrics" class="hardware-resource-gauges">
      <HardwareResourceGauge :name="t('clusterIndexPage.hardwareResourceGauge.podsReserved')" :total="podsReserved.total" :useful="podsReserved.useful" />
      <HardwareResourceGauge :name="t('clusterIndexPage.hardwareResourceGauge.coresReserved')" :total="cpuReserved.total" :useful="cpuReserved.useful" />
      <HardwareResourceGauge :name="t('clusterIndexPage.hardwareResourceGauge.ramReserved')" :total="ramReserved.total" :useful="ramReserved.useful" :units="ramReserved.units" />
    </div>
    <div v-if="showLiveMetrics" class="hardware-resource-gauges live">
      <HardwareResourceGauge :name="t('clusterIndexPage.hardwareResourceGauge.coresUsed')" :total="cpuUsed.total" :useful="cpuUsed.useful" />
      <HardwareResourceGauge :name="t('clusterIndexPage.hardwareResourceGauge.ramUsed')" :total="ramUsed.total" :useful="ramUsed.useful" :units="ramUsed.units" />
    </div>
    <SimpleBox class="events" :title="t('clusterIndexPage.sections.events.label')">
      <SortableTable
        :rows="events"
        :headers="eventHeaders"
        key-field="id"
        :search="false"
        :table-actions="false"
        :row-actions="false"
        :paging="true"
        :rows-per-page="10"
        default-sort-by="date"
      />
    </SimpleBox>
  </section>
</template>

<style lang="scss" scoped>
  .actions-span {
    align-self: center;
  }

  @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
    .resource-gauges {
      grid-template-columns: 1fr 1fr;
    }

    .hardware-resource-gauges {
      &, &.live {
        grid-template-columns: 1fr;
      }
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-9')) {
    .resource-gauges {
      grid-template-columns: 1fr 1fr 1fr;
    }

    .hardware-resource-gauges {
      grid-template-columns: 1fr 1fr 1fr;

      &.live {
        grid-template-columns: 1fr 1fr;
      }
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-12')) {
    .resource-gauges {
      grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    }
  }

  .resource-gauges {
    display: grid;
    grid-column-gap: 10px;
    grid-row-gap: 15px;
    margin-top: 25px;

    & > * {
      width: 100%;
    }
  }

  .hardware-resource-gauges {
    display: grid;
    grid-column-gap: 15px;
    grid-row-gap: 20px;
    margin-top: 30px;
    &:first-of-type {
      margin-top: 35px;
    }

    & > * {
      width: 100%;
    }
  }

  .events {
    margin-top: 30px;
  }
</style>
