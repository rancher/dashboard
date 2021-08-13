<script>
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import utc from 'dayjs/plugin/utc';
import Loading from '@/components/Loading';
import SortableTable from '@/components/SortableTable';
import { allHash } from '@/utils/promise';
import Poller from '@/utils/poller';
import { parseSi, formatSi, exponentNeeded, UNITS } from '@/utils/units';
import { REASON } from '@/config/table-headers';
import {
  EVENT, METRIC, NODE, HCI, SERVICE, PVC
} from '@/config/types';
import ResourceSummary, { resourceCounts } from '@/components/ResourceSummary';
import HardwareResourceGauge from '@/components/HardwareResourceGauge';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import HarvesterMetrics from '@/components/HarvesterMetrics';
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
  type:            NODE,
  spoofed: {
    location: {
      name:     'c-cluster-product-resource',
      params:   { resource: 'host' }
    },
    name: 'Host',
  }
},
{ type: HCI.VM }, { type: HCI.NETWORK_ATTACHMENT }, { type: HCI.IMAGE },
{
  type:    PVC,
  spoofed: {
    location: {
      name:     'c-cluster-product-resource',
      params:   { resource: 'volume' }
    },
    name: 'Volume'
  }
}];

const VM_DASHBOARD_METRICS_URL = '/api/v1/namespaces/harvester-monitoring/services/http:monitoring-grafana:80/proxy/d/harvester-vm-dashboard-1/vm-dashboard?orgId=1';

export default {
  components: {
    Loading,
    HardwareResourceGauge,
    SortableTable,
    Upgrade,
    ResourceSummary,
    Tabbed,
    Tab,
    HarvesterMetrics,
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = {
      vms:          this.fetchClusterResources(HCI.VM),
      nodes:        this.fetchClusterResources(NODE),
      events:       this.fetchClusterResources(EVENT),
      metricNodes:  this.fetchClusterResources(METRIC.NODE),
      settings:     this.fetchClusterResources(HCI.SETTING),
      services:     this.fetchClusterResources(SERVICE),
    };

    (this.accessibleResources || []).map((a) => {
      hash[a.type] = this.$store.dispatch(`${ inStore }/findAll`, { type: a.type });

      return null;
    });

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
      currentCluster:    'local',
      VM_DASHBOARD_METRICS_URL,
    };
  },

  computed: {
    accessibleResources() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return RESOURCES.filter(resource => this.$store.getters[`${ inStore }/schemaFor`](resource.type));
    },

    totalCountGaugeInput() {
      const out = {};

      this.accessibleResources.forEach((resource) => {
        const counts = resourceCounts(this.$store, resource.type);

        out[resource.type] = { resource: resource.type };

        Object.entries(counts).forEach((entry) => {
          out[resource.type][entry[0]] = entry[1];
        });

        if (resource.spoofed) {
          out[resource.type] = {
            ...out[resource.type],
            ...resource.spoofed,
            isSpoofed: true
          };

          if (out[resource.type].total > 1) {
            out[resource.type].name = `${ out[resource.type].name }s`;
          }
        }
      });

      return out;
    },

    currentVersion() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const settings = this.$store.getters[`${ inStore }/all`](HCI.SETTING);
      const setting = settings.find( S => S.id === 'server-version');

      return setting?.value || setting?.default;
    },

    firstNodeCreationTimestamp() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const days = this.$store.getters[`${ inStore }/all`](NODE).map( (N) => {
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

    cpuUsed() {
      return {
        total:  this.cpusTotal,
        useful: this.cpusUsageTotal,
      };
    },

    memoryUsed() {
      return this.createMemoryValues(this.memorysTotal, this.memorysUsageTotal);
    },

    storageUsed() {
      return this.createMemoryValues(this.storageTotal, this.storageUsage);
    },

    vmEvents() {
      return this.events.filter( E => ['VirtualMachineInstance', 'VirtualMachine'].includes(E.involvedObject.kind));
    },

    volumeEvents() {
      return this.events.filter( E => ['PersistentVolumeClaim'].includes(E.involvedObject.kind));
    },

    hostEvents() {
      return this.events.filter( E => ['Node'].includes(E.involvedObject.kind));
    },

    imageEvents() {
      return this.events.filter( E => ['VirtualMachineImage'].includes(E.involvedObject.kind));
    },

    hasMetrics() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return !!this.$store.getters[`${ inStore }/byId`]('service', 'harvester-monitoring/monitoring-grafana');
    },
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

    async fetchClusterResources(type, opt = {}, store) {
      const inStore = store || this.$store.getters['currentProduct'].inStore;

      const schema = this.$store.getters[`${ inStore }/schemaFor`](type);

      if (schema) {
        try {
          const resources = await this.$store.dispatch(`${ inStore }/findAll`, { type, opt });

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
        <label>
          {{ t('harvester.dashboard.version') }}:
        </label>
        <span>
          <span v-tooltip="{content: currentVersion}">
            {{ currentVersion }}
          </span>
        </span>
      </div>
      <div>
        <label>
          {{ t('glance.created') }}:
        </label>
        <span>
          <LiveDate
            :value="firstNodeCreationTimestamp"
            :add-suffix="true"
            :show-tooltip="true"
          />
        </span>
      </div>
    </div>

    <div class="resource-gauges">
      <ResourceSummary
        v-for="resource in totalCountGaugeInput"
        :key="resource.resource"
        :spoofed-counts="resource.isSpoofed ? resource : null"
        :resource="resource.resource"
      />
    </div>

    <h3 class="mt-40">
      {{ t('clusterIndexPage.sections.capacity.label') }}
    </h3>
    <div class="hardware-resource-gauges">
      <HardwareResourceGauge
        :name="t('harvester.dashboard.hardwareResourceGauge.cpu')"
        :reserved="cpuUsed"
      />
      <HardwareResourceGauge
        :name="t('harvester.dashboard.hardwareResourceGauge.memory')"
        :reserved="memoryUsed"
      />
      <HardwareResourceGauge
        :name="t('harvester.dashboard.hardwareResourceGauge.storage')"
        :reserved="storageUsed"
        :units="storageUsed.units"
      />
    </div>

    <Tabbed
      v-if="hasMetrics"
      class="mt-20"
    >
      <Tab
        name="metric"
        label="Metric"
      >
        <HarvesterMetrics
          :detail-url="VM_DASHBOARD_METRICS_URL"
          graph-height="825px"
          :has-sumarry-and-detail="false"
        />
      </Tab>
    </Tabbed>

    <Tabbed class="mt-20">
      <Tab
        name="host"
        label="Hosts"
        :weight="98"
      >
        <SortableTable
          :rows="hostEvents"
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
      </Tab>
      <Tab
        name="vm"
        label="VMs"
        :weight="99"
      >
        <SortableTable
          :rows="vmEvents"
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
      </Tab>
      <Tab
        name="volume"
        label="Volumes"
        :weight="97"
      >
        <SortableTable
          :rows="volumeEvents"
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
      </Tab>
      <Tab
        name="image"
        label="Images"
        :weight="96"
      >
        <SortableTable
          :rows="imageEvents"
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
      </Tab>
    </Tabbed>
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
