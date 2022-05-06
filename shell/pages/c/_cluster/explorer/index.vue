<script>
import Loading from '@shell/components/Loading';
import DashboardMetrics from '@shell/components/DashboardMetrics';
import { mapGetters } from 'vuex';
import { allHash } from '@shell/utils/promise';
import AlertTable from '@shell/components/AlertTable';
import Banner from '@shell/components/Banner';
import { parseSi, createMemoryValues } from '@shell/utils/units';
import {
  NAME,
  ROLES,
  STATE,
} from '@shell/config/table-headers';
import {
  NAMESPACE,
  INGRESS,
  MANAGEMENT,
  METRIC,
  NODE,
  SERVICE,
  PV,
  WORKLOAD_TYPES,
  COUNT,
  CATALOG,
  POD,
} from '@shell/config/types';
import { findBy } from '@shell/utils/array';
import { mapPref, CLUSTER_TOOLS_TIP } from '@shell/store/prefs';
import { haveV1Monitoring, monitoringStatus } from '@shell/utils/monitoring';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { allDashboardsExist } from '@shell/utils/grafana';
import EtcdInfoBanner from '@shell/components/EtcdInfoBanner';
import metricPoller from '@shell/mixins/metric-poller';
import EmberPage from '@shell/components/EmberPage';
import ResourceSummary, { resourceCounts } from '@shell/components/ResourceSummary';
import HardwareResourceGauge from '@shell/components/HardwareResourceGauge';
import { isEmpty } from '@shell/utils/object';
import ConfigBadge from './ConfigBadge';
import EventsTable from './EventsTable';
import { fetchClusterResources } from './explorer-utils';

export const RESOURCES = [NAMESPACE, INGRESS, PV, WORKLOAD_TYPES.DEPLOYMENT, WORKLOAD_TYPES.STATEFUL_SET, WORKLOAD_TYPES.JOB, WORKLOAD_TYPES.DAEMON_SET, SERVICE];

const CLUSTER_METRICS_DETAIL_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-cluster-nodes-1/rancher-cluster-nodes?orgId=1';
const CLUSTER_METRICS_SUMMARY_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-cluster-1/rancher-cluster?orgId=1';
const K8S_METRICS_DETAIL_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-k8s-components-nodes-1/rancher-kubernetes-components-nodes?orgId=1';
const K8S_METRICS_SUMMARY_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-k8s-components-1/rancher-kubernetes-components?orgId=1';
const ETCD_METRICS_DETAIL_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-etcd-nodes-1/rancher-etcd-nodes?orgId=1';
const ETCD_METRICS_SUMMARY_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-etcd-1/rancher-etcd?orgId=1';

const COMPONENT_STATUS = [
  'etcd',
  'scheduler',
  'controller-manager',
];

export default {
  name: 'ClusterExplorerIndexPage',

  components: {
    EtcdInfoBanner,
    DashboardMetrics,
    HardwareResourceGauge,
    Loading,
    ResourceSummary,
    Tab,
    Tabbed,
    AlertTable,
    Banner,
    EmberPage,
    ConfigBadge,
    EventsTable,
  },

  mixins: [metricPoller],

  async fetch() {
    const hash = { nodes: fetchClusterResources(this.$store, NODE) };

    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_TEMPLATE) ) {
      hash.nodeTemplates = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
    }

    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_POOL) ) {
      hash.rke1NodePools = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
    }

    this.showClusterMetrics = await allDashboardsExist(this.$store, this.currentCluster.id, [CLUSTER_METRICS_DETAIL_URL, CLUSTER_METRICS_SUMMARY_URL]);
    this.showK8sMetrics = await allDashboardsExist(this.$store, this.currentCluster.id, [K8S_METRICS_DETAIL_URL, K8S_METRICS_SUMMARY_URL]);
    this.showEtcdMetrics = this.isRKE && await allDashboardsExist(this.$store, this.currentCluster.id, [ETCD_METRICS_DETAIL_URL, ETCD_METRICS_SUMMARY_URL]);

    const res = await allHash(hash);

    for ( const k in res ) {
      this[k] = res[k];
    }
  },

  data() {
    const clusterCounts = this.$store.getters[`cluster/all`](COUNT);
    const nodeHeaders = [
      STATE,
      NAME,
      ROLES,
    ];

    return {
      nodeHeaders,
      constraints:         [],
      events:              [],
      nodeMetrics:         [],
      nodeTemplates:       [],
      nodes:               [],
      showClusterMetrics: false,
      showK8sMetrics:     false,
      showEtcdMetrics:    false,
      CLUSTER_METRICS_DETAIL_URL,
      CLUSTER_METRICS_SUMMARY_URL,
      K8S_METRICS_DETAIL_URL,
      K8S_METRICS_SUMMARY_URL,
      ETCD_METRICS_DETAIL_URL,
      ETCD_METRICS_SUMMARY_URL,
      clusterCounts
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...monitoringStatus(),

    hideClusterToolsTip: mapPref(CLUSTER_TOOLS_TIP),

    hasV1Monitoring() {
      return haveV1Monitoring(this.$store.getters);
    },

    v1MonitoringURL() {
      return `/k/${ this.currentCluster.id }/monitoring`;
    },

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

    isRKE() {
      return ['rke', 'rke.windows', 'rke2', 'rke2.windows'].includes((this.currentCluster.status.provider || '').toLowerCase());
    },

    accessibleResources() {
      // This is a list of IDs for allowed resources counts.
      const defaultAllowedResources = Object.keys(this.clusterCounts?.[0].counts).filter((typeId) => {
        return this.$store.getters['type-map/isIgnored']({ id: typeId });
      });

      // Merge with RESOURCES list
      const allowedResources = [...new Set([...defaultAllowedResources, ...RESOURCES])];

      return allowedResources.filter(resource => this.$store.getters['cluster/schemaFor'](resource));
    },

    componentServices() {
      const status = [];

      COMPONENT_STATUS.forEach((cs) => {
        status.push({
          name:      cs,
          healthy:   this.isComponentStatusHealthy(cs),
          labelKey: `clusterIndexPage.sections.componentStatus.${ cs }`,
        });
      });

      return status;
    },

    totalCountGaugeInput() {
      const totalInput = {
        name:            this.t('clusterIndexPage.resourceGauge.totalResources'),
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

    hasStats() {
      return this.currentCluster?.status?.allocatable && this.currentCluster?.status?.requested;
    },

    cpuReserved() {
      return {
        total:  parseSi(this.currentCluster?.status?.allocatable?.cpu),
        useful: parseSi(this.currentCluster?.status?.requested?.cpu)
      };
    },

    podsUsed() {
      const pods = resourceCounts(this.$store, POD);

      return {
        total:  parseSi(this.currentCluster?.status?.allocatable?.pods || '0'),
        useful: pods.total
      };
    },

    ramReserved() {
      return createMemoryValues(this.currentCluster?.status?.allocatable?.memory, this.currentCluster?.status?.requested?.memory);
    },

    metricAggregations() {
      let checkNodes = this.nodes;

      // Special case local cluster
      if (this.currentCluster.isLocal) {
        const nodeNames = this.nodes.reduce((acc, n) => {
          acc[n.id] = n;

          return acc;
        }, {});
        const managementNodes = this.$store.getters['management/all'](MANAGEMENT.NODE);

        checkNodes = managementNodes.filter((n) => {
          const nodeName = n.metadata?.labels?.['management.cattle.io/nodename'] || n.id;

          return !!nodeNames[nodeName];
        });
      }

      const someNonWorkerRoles = checkNodes.some(node => node.hasARole && !node.isWorker);
      const metrics = this.nodeMetrics.filter((nodeMetrics) => {
        const node = this.nodes.find(nd => nd.id === nodeMetrics.id);

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
      return createMemoryValues(this.currentCluster?.status?.capacity?.memory, this.metricAggregations?.memory);
    },

    hasMonitoring() {
      return !!this.clusterCounts?.[0]?.counts?.[CATALOG.APP]?.namespaces?.['cattle-monitoring-system'];
    },

    canAccessNodes() {
      return !!this.clusterCounts?.[0]?.counts?.[NODE];
    },

    canAccessDeployments() {
      return !!this.clusterCounts?.[0]?.counts?.[WORKLOAD_TYPES.DEPLOYMENT];
    },

    hasMetricsTabs() {
      return this.showClusterMetrics || this.showK8sMetrics || this.showEtcdMetrics;
    },
    hasBadge() {
      return !!this.currentCluster?.badge;
    }
  },

  methods: {
    // Ported from Ember
    isComponentStatusHealthy(field) {
      const matching = (this.currentCluster?.status?.componentStatuses || []).filter(s => s.name.startsWith(field));

      // If there's no matching component status, it's "healthy"
      if ( !matching.length ) {
        return true;
      }

      const count = matching.reduce((acc, status) => {
        const conditions = status.conditions.find(c => c.status !== 'True');

        return !conditions ? acc : acc + 1;
      }, 0);

      return count === 0;
    },

    showActions() {
      this.$store.commit('action-menu/show', {
        resources: this.currentCluster,
        elem:      this.$refs['cluster-actions'],
      });
    },

    async loadMetrics() {
      this.nodeMetrics = await fetchClusterResources(this.$store, METRIC.NODE, { force: true } );
    },
    findBy,
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <section v-else class="dashboard">
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
    <Banner
      v-if="!hideClusterToolsTip"
      :closable="true"
      class="cluster-tools-tip"
      color="info"
      label-key="cluster.toolsTip"
      @close="hideClusterToolsTip = true"
    />
    <div
      class="cluster-dashboard-glance"
    >
      <div>
        <label>{{ t('glance.provider') }}: </label>
        <span>
          {{ displayProvider }}</span>
      </div>
      <div>
        <label>{{ t('glance.version') }}: </label>
        <span v-if="currentCluster.kubernetesVersionExtension" style="font-size: 0.5em">{{ currentCluster.kubernetesVersionExtension }}</span>
        <span>{{ currentCluster.kubernetesVersionBase }}</span>
      </div>
      <div>
        <label>{{ t('glance.created') }}: </label>
        <span><LiveDate :value="currentCluster.metadata.creationTimestamp" :add-suffix="true" :show-tooltip="true" /></span>
      </div>
      <div :style="{'flex':1}" />
      <div v-if="!monitoringStatus.v2 && !monitoringStatus.v1">
        <n-link :to="{name: 'c-cluster-explorer-tools'}" class="monitoring-install">
          <i class="icon icon-gear" />
          <span>{{ t('glance.installMonitoring') }}</span>
        </n-link>
      </div>
      <div v-if="monitoringStatus.v1">
        <span>{{ t('glance.v1MonitoringInstalled') }}</span>
      </div>
      <ConfigBadge v-if="currentCluster.canUpdate" :cluster="currentCluster" />
    </div>

    <div class="resource-gauges">
      <ResourceSummary :spoofed-counts="totalCountGaugeInput" />
      <ResourceSummary v-if="canAccessNodes" resource="node" />
      <ResourceSummary v-if="canAccessDeployments" resource="apps.deployment" />
    </div>

    <h3 v-if="!hasV1Monitoring && hasStats" class="mt-40">
      {{ t('clusterIndexPage.sections.capacity.label') }}
    </h3>
    <div v-if="!hasV1Monitoring && hasStats" class="hardware-resource-gauges">
      <HardwareResourceGauge :name="t('clusterIndexPage.hardwareResourceGauge.pods')" :used="podsUsed" />
      <HardwareResourceGauge :name="t('clusterIndexPage.hardwareResourceGauge.cores')" :reserved="cpuReserved" :used="cpuUsed" />
      <HardwareResourceGauge :name="t('clusterIndexPage.hardwareResourceGauge.ram')" :reserved="ramReserved" :used="ramUsed" :units="ramReserved.units" />
    </div>

    <div v-if="!hasV1Monitoring && componentServices">
      <div v-for="status in componentServices" :key="status.name" class="k8s-component-status" :class="{'k8s-component-status-healthy': status.healthy, 'k8s-component-status-unhealthy': !status.healthy}">
        <i v-if="status.healthy" class="icon icon-checkmark" />
        <i v-else class="icon icon-warning" />
        <div>{{ t(status.labelKey) }}</div>
      </div>
    </div>

    <div v-if="hasV1Monitoring" id="ember-anchor" class="mt-20">
      <EmberPage inline="ember-anchor" :src="v1MonitoringURL" />
    </div>

    <div class="mt-30">
      <Tabbed>
        <Tab name="cluster-events" :label="t('clusterIndexPage.sections.events.label')" :weight="2">
          <EventsTable />
        </Tab>
        <Tab v-if="hasMonitoring" name="cluster-alerts" :label="t('clusterIndexPage.sections.alerts.label')" :weight="1">
          <AlertTable />
        </Tab>
      </Tabbed>
    </div>
    <Tabbed v-if="hasMetricsTabs" class="mt-30">
      <Tab v-if="showClusterMetrics" name="cluster-metrics" :label="t('clusterIndexPage.sections.clusterMetrics.label')" :weight="2">
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="CLUSTER_METRICS_DETAIL_URL"
            :summary-url="CLUSTER_METRICS_SUMMARY_URL"
            graph-height="825px"
          />
        </template>
      </Tab>
      <Tab v-if="showK8sMetrics" name="k8s-metrics" :label="t('clusterIndexPage.sections.k8sMetrics.label')" :weight="1">
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="K8S_METRICS_DETAIL_URL"
            :summary-url="K8S_METRICS_SUMMARY_URL"
            graph-height="550px"
          />
        </template>
      </Tab>
      <Tab v-if="showEtcdMetrics" name="etcd-metrics" :label="t('clusterIndexPage.sections.etcdMetrics.label')" :weight="0">
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            class="etcd-metrics"
            :detail-url="ETCD_METRICS_DETAIL_URL"
            :summary-url="ETCD_METRICS_SUMMARY_URL"
            graph-height="550px"
          >
            <EtcdInfoBanner />
          </DashboardMetrics>
        </template>
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

  &>*:not(:nth-last-child(-n+2)) {
    margin-right: 40px;

    & SPAN {
       font-weight: bold
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

.graph-options {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.etcd-metrics ::v-deep .external-link {
  top: -102px;
}

.cluster-tools-tip {
  margin-top: 0;
}

.monitoring-install {
  display: flex;
  margin-left: 10px;

  > I {
    line-height: inherit;
    margin-right: 4px;
  }

  &:focus {
    outline: 0;
  }
}

.k8s-component-status {
  align-items: center;
  display: inline-flex;
  border: 1px solid;
  margin-top: 20px;

  &:not(:last-child) {
    margin-right: 20px;
  }

  > div {
    padding: 5px 20px;
  }

  > I {
    text-align: center;
    font-size: 20px;
    padding: 5px 10px;
    border-right: 1px solid var(--border);
  }

  &.k8s-component-status-unhealthy {
    border-color: var(--error-border);

    > I {
      color: var(--error)
    }
  }

  &.k8s-component-status-healthy {
    border-color: var(--border);

    > I {
      color: var(--success)
    }
  }
}
</style>
