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
import { NAME as EXPLORER } from '@/config/product/explorer';
import SimpleBox from '@/components/SimpleBox';
import Glance from './Glance';
import ResourceGauge from './ResourceGauge';
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
const RESOURCES_PER_ROW = 5;

export default {
  components: {
    Loading,
    Glance,
    HardwareResourceGauge,
    ResourceGauge,
    SimpleBox,
    SortableTable
  },

  async fetch() {
    // @TODO stop loading these, use counts. --v
    const resources = [];

    for ( const resource of RESOURCES ) {
      const schema = this.$store.getters['cluster/schemaFor'](resource);

      if (schema) {
        resources.push(this.$store.dispatch('cluster/findAll', { type: resource }));
      }
    }

    await Promise.all(resources);
    // --^

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
    const reason = { ...REASON, ...{ canBeVariable: true } };
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
      },
      message,
      {
        align:         'center',
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

    resourceGauges() {
      const gauges = RESOURCES.map((resource, i) => {
        const schema = this.$store.getters['cluster/schemaFor'](resource);

        if (!schema) {
          return null;
        }
        const all = this.$store.getters['cluster/all'](resource);
        const resourceCounts = this.createResourceCounts(all);
        const name = this.$store.getters['type-map/labelFor'](schema, resourceCounts.useful);
        const location = {
          name:     'c-cluster-product-resource',
          params:   { product: EXPLORER, resource }
        };

        return {
          name,
          location,
          primaryColorVar: `--sizzle-${ i }`,
          ...resourceCounts
        };
      }).filter(r => r);

      const total = gauges.reduce((agg, gauge) => {
        agg.total += gauge.total;
        agg.useful += gauge.useful;
        agg.warningCount += gauge.warningCount;
        agg.errorCount += gauge.errorCount;

        return agg;
      }, {
        name:            this.t('clusterIndexPage.resourceGauge.totalResources'),
        location:        null,
        primaryColorVar: '--sizzle-8',
        total:           0,
        useful:          0,
        warningCount:    0,
        errorCount:      0
      });

      return [total, ...gauges];
    },

    resourceGaugesFiller() {
      const lastRowCount = this.resourceGauges.length % RESOURCES_PER_ROW;

      if (lastRowCount === 0) {
        return 0;
      }

      return [...Array( RESOURCES_PER_ROW - lastRowCount)];
    },

    cpuReserved() {
      return {
        total:  parseSi(this.cluster?.status?.allocatable?.cpu),
        useful: parseSi(this.cluster?.status?.requested?.cpu)
      };
    },

    podsReserved() {
      return {
        total:  parseSi(this.cluster?.status?.allocatable?.pods || '0'),
        useful: parseSi(this.cluster?.status?.requested?.pods || '0')
      };
    },

    ramReserved() {
      return this.createMemoryValues(this.cluster?.status?.allocatable?.memory, this.cluster?.status?.requested?.memory);
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
        total:  parseSi(this.cluster?.status?.capacity?.cpu),
        useful: this.metricAggregations.cpu
      };
    },

    ramUsed() {
      return this.createMemoryValues(this.cluster?.status?.capacity?.memory, this.metricAggregations.memory);
    },

    showReservedMetrics() {
      // As long as we have at least one reserved value > 0 we should show these metrics
      const reservedSum = [this.cpuReserved, this.podsReserved, this.ramReserved].reduce((agg, cur) => {
        return agg + (cur.total || 0) + (cur.useful || 0);
      }, 0);

      return reservedSum > 0;
    },

    showLiveMetrics() {
      return !!this.metricAggregations;
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

    createResourceCounts(resources) {
      const errorCount = resources.filter(resource => resource.stateBackground === 'bg-error').length;
      const notSuccessCount = resources.filter(resource => resource.stateBackground !== 'bg-success').length;
      const warningCount = notSuccessCount - errorCount;

      return {
        total:        resources.length,
        useful:       resources.length - notSuccessCount,
        warningCount,
        errorCount
      };
    },
    showActions() {
      this.$store.commit('action-menu/show', {
        resources: this.cluster,
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
      :provider="displayProvider"
      :kubernetes-version="currentCluster.kubernetesVersion"
      :total-nodes="(nodes || []).length"
      :created="currentCluster.metadata.creationTimestamp"
    />
    <div class="resource-gauges">
      <ResourceGauge v-for="resourceGauge in resourceGauges" :key="resourceGauge.name" v-bind="resourceGauge" />
      <div v-for="(filler, i) in resourceGaugesFiller" :key="i" class="filler" />
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
  section {
    min-width: 1140px;
  }

  .actions-span {
    align-self: center;
  }

  .resource-gauges {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;

    & > * {
      min-width: 210px;
      max-width: calc(20% - 10px);
      width: 100%;
      margin: 10px 0 0 0;
    }
  }

  .hardware-resource-gauges {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-top: 50px;

    & > * {
      min-width: 352px;
      width: calc(33.333% - 10px);
    }

    &.live {
      margin-top: 30px;
      & > * {
        width: calc(50% - 8px);
      }
    }
  }

  .events {
    margin-top: 30px;
  }
</style>
