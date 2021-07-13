<script>
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import utc from 'dayjs/plugin/utc';
import Loading from '@/components/Loading';
import isEmpty from 'lodash/isEmpty';
import SortableTable from '@/components/SortableTable';
import { allHash } from '@/utils/promise';
import Poller from '@/utils/poller';
import { parseSi, formatSi, exponentNeeded, UNITS } from '@/utils/units';
import { REASON } from '@/config/table-headers';
import { EVENT, METRIC, NODE, HCI } from '@/config/types';
import SimpleBox from '@/components/SimpleBox';
import ResourceGauge from '@/components/ResourceGauge';
import HardwareResourceGauge from './HardwareResourceGauge';
import Upgrade from './Upgrade';

dayjs.extend(utc);
dayjs.extend(minMax);

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

const METRICS_POLL_RATE_MS = 20000;
const MAX_FAILURES = 2;

const RESOURCES = [{
  type:          NODE,
  visitResource: 'host'
}, { type: HCI.VM }, { type: HCI.NETWORK_ATTACHMENT }, { type: HCI.IMAGE }, { type: HCI.DATA_VOLUME }];

export default {
  components: {
    Loading,
    HardwareResourceGauge,
    ResourceGauge,
    SimpleBox,
    SortableTable,
    Upgrade,
  },

  async fetch() {
    const hash = {
      vms:         this.fetchClusterResources(HCI.VM),
      nodes:       this.fetchClusterResources(NODE),
      events:      this.fetchClusterResources(EVENT),
      metricNodes: this.fetchClusterResources(METRIC.NODE),
    };

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

    return {
      metricPoller:   null,
      eventHeaders,
      constraints:       [],
      events:            [],
      nodeMetrics:       [],
      nodes:             [],
      metricNodes:       [],
      vms:               [],
      currentCluster:    'local'
    };
  },

  computed: {
    accessibleResources() {
      return RESOURCES.filter(resource => this.$store.getters['cluster/schemaFor'](resource.type));
    },

    currentVersion() {
      const settings = this.$store.getters['cluster/all'](HCI.SETTING);
      const setting = settings.find( S => S.id === 'server-version');

      return setting?.value || setting?.default;
    },

    firstNodeCreationTimestamp() {
      const days = this.$store.getters['cluster/all'](NODE).map( (N) => {
        return dayjs(N.metadata.creationTimestamp);
      });

      if (!days.length) {
        return dayjs().utc().format();
      }

      return dayjs.min(days).utc().format();
    },

    cpusTotal() {
      let out = 0;

      this.metricNodes.forEach((node) => {
        out += node.cpuCapacity;
      });

      return out;
    },

    cpusUsageTotal() {
      let out = 0;

      this.metricNodes.forEach((node) => {
        out += node.cpuUsage;
      });

      return out;
    },

    memorysTotal() {
      let out = 0;

      this.metricNodes.forEach((node) => {
        out += node.memoryCapacity;
      });

      return out;
    },

    memorysUsageTotal() {
      let out = 0;

      this.metricNodes.forEach((node) => {
        out += node.memoryUsage;
      });

      return out;
    },

    storageUsage() {
      let out = 0;

      this.metricNodes.forEach((node) => {
        out += node.storageUsage;
      });

      return out;
    },

    storageTotal() {
      let out = 0;

      this.metricNodes.forEach((node) => {
        out += node.storageTotal;
      });

      return out;
    },

    cpuReserved() {
      return {
        total:  parseSi(this.currentCluster?.status?.allocatable?.cpu),
        useful: parseSi(this.currentCluster?.status?.requested?.cpu)
      };
    },

    podsReserved() {
      return {
        total:  this.storageTotal,
        useful: this.storageUsage
      };
    },

    ramReserved() {
      return {
        total:  this.memorysTotal,
        useful: this.memorysUsageTotal
      };
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
        // total:  formatSi(this.cpusTotal),
        // useful: formatSi(this.cpusUsageTotal)
        total:  this.cpusTotal,
        useful: this.cpusUsageTotal
      };
    },

    memoryUsed() {
      return this.createMemoryValues(this.memorysTotal, this.memorysUsageTotal);
    },

    storageUsed() {
      return this.createMemoryValues(this.storageTotal, this.storageUsage);
    },

    filterEvents() {
      return this.events.filter( E => ['VirtualMachineInstance', 'VirtualMachine'].includes(E.involvedObject.kind));
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
    <Upgrade />

    <div
      class="cluster-dashboard-glance"
    >
      <div>
        <label>{{ t('glance.created') }}: </label>
        <span><LiveDate :value="firstNodeCreationTimestamp" :add-suffix="true" :show-tooltip="true" /></span>
      </div>
    </div>

    <div class="resource-gauges mb-20">
      <ResourceGauge
        v-for="(resource, i) in accessibleResources"
        :key="resource.type"
        :resource="resource.type"
        :visit-resource="resource.visitResource"
        :primary-color-var="`--sizzle-${i}`"
      />
    </div>

    <div class="hardware-resource-gauges">
      <HardwareResourceGauge :name="t('harvester.dashboard.hardwareResourceGauge.cpu')" :total="cpuUsed.total" :useful="cpuUsed.useful" />
      <HardwareResourceGauge :name="t('harvester.dashboard.hardwareResourceGauge.memory')" :total="memoryUsed.total" :useful="memoryUsed.useful" :units="memoryUsed.units" />
      <HardwareResourceGauge :name="t('harvester.dashboard.hardwareResourceGauge.storage')" :total="storageUsed.total" :useful="storageUsed.useful" :units="storageUsed.units" />
    </div>

    <SimpleBox class="events" :title="t('harvester.dashboard.sections.events.label')">
      <SortableTable
        :rows="filterEvents"
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
          <div class="text-info">
            {{ value }}
          </div>
          <div v-if="row.message">
            {{ row.displayMessage }}
          </div>
        </template>
      </SortableTable>
    </SimpleBox>
  </section>
</template>

<style lang="scss" scoped>
  .cluster-dashboard-glance {
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 20px 0px;
    display: flex;

    &>*{
      margin-right: 40px;

      & SPAN {
        font-weight: bold
      }
    }
  }

  .events {
    margin-top: 30px;
  }
</style>
