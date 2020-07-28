<script>
import capitalize from 'lodash/capitalize';
import isEmpty from 'lodash/isEmpty';
import { get } from '@/utils/object';
import SortableTable from '@/components/SortableTable';
import { APP_ID as GATEKEEPER_APP_ID } from '@/config/product/gatekeeper';
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
import { SYSTEM_PROJECT } from '@/config/labels-annotations';
import {
  NAMESPACE,
  INGRESS,
  EXTERNAL,
  EVENT,
  MANAGEMENT,
  METRIC,
  NODE,
  SERVICE,
  STEVE,
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

export default {
  components: {
    Glance,
    HardwareResourceGauge,
    ResourceGauge,
    SimpleBox,
    SortableTable
  },

  async asyncData(ctx) {
    const { route, store } = ctx;
    const id = get(route, 'params.cluster');
    let gatekeeper = null;
    let gatekeeperEnabled = false;
    let cluster = null;

    if ( store.getters['isMultiCluster'] ) {
      const projects = await store.dispatch('clusterExternal/findAll', { type: EXTERNAL.PROJECT });
      const targetSystemProject = projects.find(( proj ) => {
        const labels = proj.metadata?.labels || {};

        if ( labels[SYSTEM_PROJECT] === 'true' ) {
          return true;
        }
      });

      if (!isEmpty(targetSystemProject)) {
        const systemNamespace = targetSystemProject.metadata.name;

        try {
          gatekeeper = await store.dispatch('clusterExternal/find', {
            type: EXTERNAL.APP,
            id:   `${ systemNamespace }/${ GATEKEEPER_APP_ID }`,
          });
          if (!isEmpty(gatekeeper)) {
            gatekeeperEnabled = true;
          }
        } catch (err) {
          gatekeeperEnabled = false;
        }
      }

      cluster = await store.dispatch('management/find', { type: MANAGEMENT.CLUSTER, id });
    } else {
      cluster = await store.dispatch('management/find', { type: STEVE.CLUSTER, id });
    }

    const resources = RESOURCES.map((resource) => {
      const schema = store.getters['cluster/schemaFor'](resource);

      if (schema) {
        store.dispatch('cluster/findAll', { type: resource });
      }

      return Promise.resolve();
    });

    Promise.all(resources);

    return {
      constraints:       [],
      events:            [],
      nodeMetrics:       [],
      haveNodes:         !!store.getters['cluster/schemaFor'](NODE),
      haveNodeTemplates: !!store.getters['management/schemaFor'](MANAGEMENT.NODE_TEMPLATE),
      haveNodePools:     !!store.getters['management/schemaFor'](MANAGEMENT.NODE_POOL),
      nodePools:         [],
      nodeTemplates:     [],
      nodes:             [],
      cluster,
      gatekeeperEnabled,
    };
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
      metricPoller:      new Poller(this.loadMetrics, METRICS_POLL_RATE_MS, MAX_FAILURES),
      gatekeeperEnabled: false,
      eventHeaders,
      nodeHeaders,
    };
  },

  computed: {
    displayProvider() {
      const cluster = this.cluster;
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
    this.metricPoller.start();
  },

  async created() {
    const hash = {
      nodes:       this.fetchClusterResources(NODE),
      events:      this.fetchClusterResources(EVENT),
    };

    if ( this.haveNodeTemplates ) {
      hash.nodeTemplates = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
    }

    if ( this.haveNodePools ) {
      hash.nodePools = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
    }

    const res = await allHash(hash);

    for ( const k in res ) {
      this[k] = res[k];
    }
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
  <section>
    <header class="row">
      <div class="span-11">
        <h1>
          <t k="clusterIndexPage.header" />
        </h1>
        <div>
          <span v-if="cluster.spec.description">{{ cluster.spec.description }}</span>
        </div>
      </div>
    </header>
    <Glance :provider="displayProvider" :kubernetes-version="cluster.kubernetesVersion" :total-nodes="(nodes || []).length" :created="cluster.metadata.creationTimestamp" />
    <div class="resource-gauges">
      <ResourceGauge v-for="resourceGauge in resourceGauges" :key="resourceGauge.name" v-bind="resourceGauge" />
    </div>
    <div v-if="showReservedMetrics" class="hardware-resource-gauges">
      <HardwareResourceGauge name="Pods Reserved" :total="podsReserved.total" :useful="podsReserved.useful" :suffix="t('clusterIndexPage.hardwareResourceGauge.podsReserved')" />
      <HardwareResourceGauge name="Cores Reserved" :total="cpuReserved.total" :useful="cpuReserved.useful" :suffix="t('clusterIndexPage.hardwareResourceGauge.coresReserved')" />
      <HardwareResourceGauge name="Ram Reserved" :total="ramReserved.total" :useful="ramReserved.useful" :units="ramReserved.units" :suffix="t('clusterIndexPage.hardwareResourceGauge.ramReserved')" />
    </div>
    <div v-if="showLiveMetrics" class="hardware-resource-gauges live">
      <HardwareResourceGauge name="Cores Used" :total="cpuUsed.total" :useful="cpuUsed.useful" :suffix="t('clusterIndexPage.hardwareResourceGauge.coresUsed')" />
      <HardwareResourceGauge name="Ram Used" :total="ramUsed.total" :useful="ramUsed.useful" :units="ramUsed.units" :suffix="t('clusterIndexPage.hardwareResourceGauge.ramUsed')" />
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
