<script>
import Loading from '@/components/Loading';
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';
import SortableTable from '@/components/SortableTable';
import { allHash } from '@/utils/promise';
import Poller from '@/utils/poller';
import { parseSi, formatSi, exponentNeeded, UNITS } from '@/utils/units';
import {
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
import { findBy } from '@/utils/array';
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
    Glance,
    HardwareResourceGauge,
    Loading,
    ResourceGauge,
    SimpleBox,
    SortableTable,
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

    const eventHeaders = [
      reason,
      {
        name:          'resource',
        label:         'Resource',
        labelKey:      'clusterIndexPage.sections.events.resource.label',
        value:         'displayInvolvedObject',
        sort:          ['involvedObject.kind', 'involvedObject.name'],
        canBeVariable: true,
      },
      {
        align:         'right',
        name:          'date',
        label:         'Date',
        labelKey:      'clusterIndexPage.sections.events.date.label',
        value:         'lastTimestamp',
        sort:          'lastTimestamp:desc',
        formatter:     'LiveDate',
        formatterOpts: { addSuffix: true },
        width:         125,
        defaultSort:   true,
      },
    ];

    const nodeHeaders = [
      STATE,
      NAME,
      ROLES,
    ];

    return {
      metricPoller:      null,
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
      const other = 'other';
      let provider = this.currentCluster.status.provider || other;

      if (provider === 'rke.windows') {
        provider = 'rkeWindows';
      }

      if (!this.$store.getters['i18n/exists'](`cluster.provider.${ provider }`)) {
        provider = 'other';
      }

      return this.t(`cluster.provider.${ provider }`);
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

    podsUsed() {
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
      const reservedSum = [this.cpuReserved, this.podsUsed, this.ramReserved].reduce((agg, cur) => {
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
    findBy,
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
    <header>
      <div class="title">
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
      class="cluster-dashboard-glance"
    >
      <template #displayProvider>
        <div class="title-content">
          <h1>{{ displayProvider }}</h1>
          <label>{{ t('glance.provider') }}</label>
        </div>
        <div class="logo">
          <img class="os-provider-logo" :src="currentCluster.providerOsLogo" />
        </div>
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
      <HardwareResourceGauge :name="t('clusterIndexPage.hardwareResourceGauge.podsUsed')" :total="podsUsed.total" :useful="podsUsed.useful" />
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
      >
        <template #cell:resource="{row, value}">
          <n-link :to="row.detailLocation">
            {{ value }}
          </n-link>
          <div v-if="row.message">
            {{ row.displayMessage }}
          </div>
        </template>
      </SortableTable>
    </SimpleBox>
  </section>
</template>

<style lang="scss" scoped>
.glance.cluster-dashboard-glance ::v-deep {
  .tile:first-child {
    flex-direction: row;

    .title-content,
    .logo {
      flex: 1;
    }

    .title-content {
      &:first-child {
        flex-basis: 75%;
      }
    }

    .logo {
      display: flex;
      justify-content: flex-end;
      align-self: center;
      padding-right: 20px;
    }
  }
}

.title h1 {
  margin: 0;
}

.actions-span {
  align-self: center;
}

.events {
  margin-top: 30px;
}

.os-provider-logo {
  height: 40px;
  width: 40px;
}
</style>
