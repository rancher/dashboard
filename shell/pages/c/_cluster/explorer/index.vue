<script>
import DashboardMetrics from '@shell/components/DashboardMetrics';
import { mapGetters } from 'vuex';
import {
  CAPI,
  ENDPOINTS,
  EVENT,
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
  SECRET
} from '@shell/config/types';
import { NODE_ARCHITECTURE } from '@shell/config/labels-annotations';
import { setPromiseResult } from '@shell/utils/promise';
import AlertTable from '@shell/components/AlertTable';
import { Banner } from '@components/Banner';
import { parseSi, createMemoryValues } from '@shell/utils/units';
import {
  NAME,
  ROLES,
  STATE,
} from '@shell/config/table-headers';

import { monitoringStatus, canViewGrafanaLink } from '@shell/utils/monitoring';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { allDashboardsExist } from '@shell/utils/grafana';
import EtcdInfoBanner from '@shell/components/EtcdInfoBanner';
import metricPoller from '@shell/mixins/metric-poller';
import ResourceSummary, { resourceCounts } from '@shell/components/ResourceSummary';
import HardwareResourceGauge from '@shell/components/HardwareResourceGauge';
import { isEmpty } from '@shell/utils/object';
import ConfigBadge from './ConfigBadge';
import EventsTable from './EventsTable';
import { fetchClusterResources } from './explorer-utils';
import SimpleBox from '@shell/components/SimpleBox';
import { ExtensionPoint, CardLocation } from '@shell/core/types';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import Certificates from '@shell/components/Certificates';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import TabTitle from '@shell/components/TabTitle';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

export const RESOURCES = [NAMESPACE, INGRESS, PV, WORKLOAD_TYPES.DEPLOYMENT, WORKLOAD_TYPES.STATEFUL_SET, WORKLOAD_TYPES.JOB, WORKLOAD_TYPES.DAEMON_SET, SERVICE];

const CLUSTER_METRICS_DETAIL_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-cluster-nodes-1/rancher-cluster-nodes?orgId=1';
const CLUSTER_METRICS_SUMMARY_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-cluster-1/rancher-cluster?orgId=1';
const K8S_METRICS_DETAIL_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-k8s-components-nodes-1/rancher-kubernetes-components-nodes?orgId=1';
const K8S_METRICS_SUMMARY_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-k8s-components-1/rancher-kubernetes-components?orgId=1';
const ETCD_METRICS_DETAIL_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-etcd-nodes-1/rancher-etcd-nodes?orgId=1';
const ETCD_METRICS_SUMMARY_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-etcd-1/rancher-etcd?orgId=1';

const CLUSTER_COMPONENTS = [
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
    ResourceSummary,
    Tab,
    Tabbed,
    AlertTable,
    Banner,
    ConfigBadge,
    EventsTable,
    SimpleBox,
    Certificates,
    TabTitle
  },

  mixins: [metricPoller],

  fetch() {
    fetchClusterResources(this.$store, NODE);

    if (this.currentCluster) {
      setPromiseResult(
        allDashboardsExist(this.$store, this.currentCluster.id, [CLUSTER_METRICS_DETAIL_URL, CLUSTER_METRICS_SUMMARY_URL]),
        this,
        'showClusterMetrics',
        `Determine cluster metrics`
      );
      setPromiseResult(
        allDashboardsExist(this.$store, this.currentCluster.id, [K8S_METRICS_DETAIL_URL, K8S_METRICS_SUMMARY_URL]),
        this,
        'showK8sMetrics',
        `Determine k8s metrics`
      );
      setPromiseResult(
        allDashboardsExist(this.$store, this.currentCluster.id, [ETCD_METRICS_DETAIL_URL, ETCD_METRICS_SUMMARY_URL]),
        this,
        'showEtcdMetrics',
        `Determine etcd metrics`
      );

      // It's not enough to check that the grafana links are working for the current user; embedded cluster-level dashboards should only be shown if the user can view the grafana endpoint
      // https://github.com/rancher/dashboard/issues/9792
      setPromiseResult(canViewGrafanaLink(this.$store), this, 'canViewMetrics', 'Determine Grafana Permission');

      if (this.currentCluster.isLocal && this.$store.getters['management/schemaFor'](MANAGEMENT.NODE)) {
        this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE });
      }
    }
  },

  data() {
    const clusterCounts = this.$store.getters[`cluster/all`](COUNT);
    const nodeHeaders = [
      STATE,
      NAME,
      ROLES,
    ];

    const clusterServiceIcons = {
      [STATES_ENUM.IN_PROGRESS]: 'icon-spinner icon-spin',
      [STATES_ENUM.HEALTHY]:     'icon-checkmark',
      [STATES_ENUM.WARNING]:     'icon-warning',
      [STATES_ENUM.UNHEALTHY]:   'icon-warning',
    };

    return {
      nodeHeaders,
      constraints:             [],
      cattleAgentResource:     'loading',
      fleetControllerResource: 'loading',
      fleetAgentResource:      'loading',
      disconnected:            false,
      events:                  [],
      nodeMetrics:             [],
      showClusterMetrics:      false,
      showK8sMetrics:          false,
      showEtcdMetrics:         false,
      canViewMetrics:          false,
      CLUSTER_METRICS_DETAIL_URL,
      CLUSTER_METRICS_SUMMARY_URL,
      K8S_METRICS_DETAIL_URL,
      K8S_METRICS_SUMMARY_URL,
      ETCD_METRICS_DETAIL_URL,
      ETCD_METRICS_SUMMARY_URL,
      STATES_ENUM,
      clusterCounts,
      selectedTab:             'cluster-events',
      extensionCards:          getApplicableExtensionEnhancements(this, ExtensionPoint.CARD, CardLocation.CLUSTER_DASHBOARD_CARD, this.$route),
      canViewEvents:           !!this.$store.getters['cluster/schemaFor'](EVENT),
      clusterServiceIcons,
    };
  },

  beforeUnmount() {
    // Remove the data and stop watching resources that were fetched in this page
    // Events in particular can lead to change messages having to be processed when we are no longer interested in events
    this.$store.dispatch('cluster/forgetType', EVENT);
    this.$store.dispatch('cluster/forgetType', NODE);
    this.$store.dispatch('cluster/forgetType', ENDPOINTS); // Used by AlertTable to get alerts when v2 monitoring is installed
    this.$store.dispatch('cluster/forgetType', METRIC.NODE);
    this.$store.dispatch('cluster/forgetType', MANAGEMENT.NODE);
    this.$store.dispatch('cluster/forgetType', WORKLOAD_TYPES.DEPLOYMENT);

    clearInterval(this.interval);
  },

  watch: {
    canViewAgents: {
      handler(neu, old) {
        if (neu && !old) {
          this.loadAgents();
        }
      },
      immediate: true
    }
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...monitoringStatus(),

    nodes() {
      return this.$store.getters['cluster/all'](NODE);
    },

    mgmtNodes() {
      return this.$store.getters['management/all'](MANAGEMENT.CLUSTER);
    },

    fleetAgentNamespace() {
      return this.$store.getters['cluster/canList'](WORKLOAD_TYPES.DEPLOYMENT) && this.$store.getters['cluster/byId'](NAMESPACE, 'cattle-fleet-system');
    },

    cattleAgentNamespace() {
      if (this.currentCluster.isLocal) {
        return;
      }

      return this.$store.getters['cluster/canList'](WORKLOAD_TYPES.DEPLOYMENT) && this.$store.getters['cluster/byId'](NAMESPACE, 'cattle-system');
    },

    canViewAgents() {
      return !!this.fleetAgentNamespace || (!this.currentCluster.isLocal && this.cattleAgentNamespace);
    },

    showClusterTools() {
      return this.$store.getters['cluster/canList'](CATALOG.CLUSTER_REPO) &&
      this.$store.getters['cluster/canList'](CATALOG.APP);
    },

    displayProvider() {
      const other = 'other';

      let provider = this.currentCluster?.status?.provider || other;

      if (provider === 'rke.windows') {
        provider = 'rkeWindows';
      }

      if (!this.$store.getters['i18n/exists'](`cluster.provider.${ provider }`)) {
        provider = 'other';
      }

      return this.t(`cluster.provider.${ provider }`);
    },

    nodesArchitecture() {
      const obj = {};

      this.nodes?.forEach((node) => {
        if (!node.metadata?.state?.transitioning) {
          const architecture = node.labels?.[NODE_ARCHITECTURE];

          const key = architecture || this.t('cluster.architecture.label.unknown');

          obj[key] = (obj[key] || 0) + 1;
        }
      });

      return obj;
    },

    architecture() {
      const keys = Object.keys(this.nodesArchitecture);

      switch (keys.length) {
      case 0:
        return { label: this.t('generic.provisioning') };
      case 1:
        return { label: keys[0] };
      default:
        return {
          label:   this.t('cluster.architecture.label.mixed'),
          tooltip: keys.reduce((acc, k) => `${ acc }${ k }: ${ this.nodesArchitecture[k] }<br>`, '')
        };
      }
    },

    isHarvesterCluster() {
      return this.currentCluster?.isHarvester;
    },

    isRKE() {
      return ['rke', 'rke.windows', 'rke2', 'rke2.windows'].includes((this.currentCluster.status.provider || '').toLowerCase());
    },

    accessibleResources() {
      // This is a list of IDs for allowed resources counts.
      const defaultAllowedResources = Object.keys(this.clusterCounts?.[0]?.counts || {}).filter((typeId) => {
        return this.$store.getters['type-map/isIgnored']({ id: typeId });
      });

      // Merge with RESOURCES list
      const allowedResources = [...new Set([...defaultAllowedResources, ...RESOURCES])];

      return allowedResources.filter((resource) => this.$store.getters['cluster/schemaFor'](resource));
    },

    clusterServices() {
      const services = [];

      CLUSTER_COMPONENTS.forEach((name) => {
        const component = this.getComponentStatus(name);

        services.push({
          name,
          status:   component.state,
          labelKey: `clusterIndexPage.sections.componentStatus.component.${ name }.label`,
          icon:     this.clusterServiceIcons[component.state],
          tooltip:  component.tooltip,
          goTo:     () => null,
        });
      });

      if (this.cattleAgentNamespace) {
        services.push({
          name:     'cattle',
          status:   this.cattleAgent.state,
          labelKey: 'clusterIndexPage.sections.componentStatus.component.cattle.label',
          icon:     this.clusterServiceIcons[this.cattleAgent.state],
          tooltip:  this.cattleAgent.tooltip,
          goTo:     () => this.goToClusterService(this.cattleAgent),
        });
      }

      if (this.fleetAgentNamespace) {
        services.push({
          name:     'fleet',
          status:   this.fleetAgent.state,
          labelKey: 'clusterIndexPage.sections.componentStatus.component.fleet.label',
          icon:     this.clusterServiceIcons[this.fleetAgent.state],
          tooltip:  this.fleetAgent.tooltip,
          goTo:     () => this.goToClusterService(this.fleetAgent),
        });
      }

      return services;
    },

    cattleAgent() {
      const resources = [this.cattleAgentResource];

      return this.getAgentStatus(resources, { checkDisconnected: true });
    },

    fleetAgent() {
      const resources = this.currentCluster.isLocal ? [
        /**
         * 'fleetAgentResource' could take a while to be created by rancher.
         * During that startup period, only 'fleetControllerResource' will be used to calculate the fleet agent status.
         */
        ...(this.fleetAgentResource ? [this.fleetAgentResource, this.fleetControllerResource] : [this.fleetControllerResource]),
      ] : [
        this.fleetAgentResource
      ];

      return this.getAgentStatus(resources);
    },

    totalCountGaugeInput() {
      const totalInput = {
        name:         this.t('clusterIndexPage.resourceGauge.totalResources'),
        total:        0,
        useful:       0,
        warningCount: 0,
        errorCount:   0
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
      const total = parseSi(this.currentCluster?.status?.allocatable?.cpu);

      return {
        total,
        useful: parseSi(this.currentCluster?.status?.requested?.cpu),
        units:  this.t('clusterIndexPage.hardwareResourceGauge.units.cores', { count: total })
      };
    },

    podsUsed() {
      return {
        total:  parseSi(this.currentCluster?.status?.allocatable?.pods || '0'),
        useful: parseSi(this.currentCluster?.status?.requested?.pods || '0'),
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

        checkNodes = this.mgmtNodes.filter((n) => {
          const nodeName = n.metadata?.labels?.['management.cattle.io/nodename'] || n.id;

          return !!nodeNames[nodeName];
        });
      }

      const someNonWorkerRoles = checkNodes.some((node) => node.hasARole && !node.isWorker);
      const metrics = this.nodeMetrics.filter((nodeMetrics) => {
        const node = this.nodes.find((nd) => nd.id === nodeMetrics.id);

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
      const total = parseSi(this.currentCluster?.status?.capacity?.cpu);

      return {
        total,
        useful: this.metricAggregations?.cpu,
        units:  this.t('clusterIndexPage.hardwareResourceGauge.units.cores', { count: total })
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
      return this.canViewMetrics && ( this.showClusterMetrics || this.showK8sMetrics || this.showEtcdMetrics);
    },

    hasBadge() {
      return !!this.currentCluster?.badge;
    },

    hasDescription() {
      return !!this.currentCluster?.spec?.description;
    },

    allSecretsLink() {
      return {
        name:   'c-cluster-product-resource',
        params: {
          product:  EXPLORER,
          resource: SECRET,
        }
      };
    },
    hasNodes() {
      return this.nodes?.length > 0;
    },
  },

  methods: {
    loadAgents() {
      if (this.fleetAgentNamespace) {
        if (this.currentCluster.isLocal) {
          this.setAgentResource('fleetControllerResource', 'cattle-fleet-system/fleet-controller');
          this.setAgentResource('fleetAgentResource', 'cattle-fleet-local-system/fleet-agent');
        } else {
          this.setAgentResource('fleetAgentResource', 'cattle-fleet-system/fleet-agent');
        }
      }
      if (this.cattleAgentNamespace) {
        this.setAgentResource('cattleAgentResource', 'cattle-system/cattle-cluster-agent');
        this.interval = setInterval(() => {
          this.disconnected = !!this.$store.getters['cluster/inError']({ type: NODE });
        }, 1000);
      }
    },

    async setAgentResource(agent, id) {
      try {
        this[agent] = await this.$store.dispatch('cluster/find', { type: WORKLOAD_TYPES.DEPLOYMENT, id });
      } catch (err) {
        this[agent] = null;
      }
    },

    getAgentStatus(resources, opt = { checkDisconnected: false }) {
      if (resources.find((resource) => resource === 'loading')) {
        return { state: STATES_ENUM.IN_PROGRESS };
      }

      for (const resource of resources) {
        if (
          !resource ||
          (opt.checkDisconnected && this.disconnected) || // cattle
          resource.status.conditions?.find((c) => c.status !== 'True') ||
          resource.metadata.state?.error
        ) {
          return {
            resource,
            tooltip: resource?.stateDescription || this.t(`clusterIndexPage.sections.componentStatus.tooltip.disconnected`),
            state:   STATES_ENUM.UNHEALTHY,
          };
        }
      }

      for (const resource of resources) {
        if (resource.spec.replicas !== resource.status.readyReplicas || resource.status.unavailableReplicas > 0) {
          return {
            resource,
            tooltip: resource?.stateDescription || this.t(`clusterIndexPage.sections.componentStatus.tooltip.unavailableReplicas`),
            state:   STATES_ENUM.WARNING,
          };
        }
      }

      return { state: STATES_ENUM.HEALTHY };
    },

    getComponentStatus(field) {
      const matching = (this.currentCluster?.status?.componentStatuses || []).filter((s) => s.name.startsWith(field));

      // If there's no matching component status, it's "healthy"
      if ( !matching.length ) {
        return { state: STATES_ENUM.HEALTHY };
      }

      const errorConditions = matching.reduce((acc, status) => {
        const condition = status.conditions.find((c) => c.status !== 'True');

        return !condition ? acc : [...acc, condition];
      }, []);

      if (errorConditions.length > 0) {
        return {
          tooltip: errorConditions[0].message,
          state:   STATES_ENUM.UNHEALTHY
        };
      }

      return { state: STATES_ENUM.HEALTHY };
    },

    showActions() {
      this.$store.commit('action-menu/show', {
        resources: this.currentCluster,
        elem:      this.$refs['cluster-actions'],
      });
    },

    // Used by metric-poller mixin
    async loadMetrics() {
      this.nodeMetrics = await fetchClusterResources(this.$store, METRIC.NODE, { force: true } );
    },

    // Events/Alerts tab changed
    tabChange(neu) {
      this.selectedTab = neu?.selectedName;
    },

    async goToHarvesterCluster() {
      try {
        const provClusters = await this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER });
        const provCluster = provClusters.find((p) => p.mgmt.id === this.currentCluster.id);

        await provCluster.goToHarvesterCluster();
      } catch {
      }
    },

    goToClusterService(agent) {
      if (!agent.resource || agent.state === STATES_ENUM.HEALTHY) {
        return;
      }

      this.$router.push({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          cluster:   this.currentCluster.id,
          product:   'explorer',
          resource:  agent.resource.type,
          namespace: agent.resource.metadata.namespace,
          id:        agent.resource.metadata.name,
        }
      });
    }
  },
};
</script>

<template>
  <section class="dashboard">
    <header>
      <div class="title">
        <h1>
          <TabTitle>
            {{ t('clusterIndexPage.header') }}
          </TabTitle>
        </h1>
        <div
          v-if="hasDescription"
          class="cluster-dashboard-description"
        >
          <span>{{ currentCluster.spec.description }}</span>
        </div>
      </div>
    </header>
    <div
      class="cluster-dashboard-glance"
    >
      <div data-testid="clusterProvider__label">
        <label>{{ t('glance.provider') }}: </label>
        <span v-if="isHarvesterCluster">
          <button
            class="btn role-link harvester-cluster-link"
            role="button"
            :aria-label="displayProvider"
            @click="goToHarvesterCluster"
          >
            {{ displayProvider }}
          </button>
        </span>
        <span v-else>
          {{ displayProvider }}
        </span>
      </div>
      <div data-testid="kubernetesVersion__label">
        <label>{{ t('glance.version') }}: </label>
        <span>{{ currentCluster.kubernetesVersionBase }}</span>
        <span
          v-if="currentCluster.kubernetesVersionExtension"
          style="font-size: 0.75em"
        >{{ currentCluster.kubernetesVersionExtension }}</span>
      </div>
      <div
        v-if="hasNodes"
        data-testid="architecture__label"
      >
        <label>{{ t('glance.architecture') }}: </label>
        <span v-clean-tooltip="architecture.tooltip">
          {{ architecture.label }}
        </span>
      </div>
      <div data-testid="created__label">
        <label>{{ t('glance.created') }}: </label>
        <span>
          <LiveDate
            :value="currentCluster.metadata.creationTimestamp"
            :add-suffix="true"
            :show-tooltip="true"
          />
        </span>
      </div>
      <div :style="{'flex':1}" />
      <div v-if="showClusterTools">
        <router-link
          :to="{name: 'c-cluster-explorer-tools'}"
          class="cluster-tools-link"
          role="link"
          :aria-label="t('nav.clusterTools')"
        >
          <span>{{ t('nav.clusterTools') }}</span>
        </router-link>
      </div>
      <ConfigBadge
        v-if="currentCluster.canUpdate"
        :cluster="currentCluster"
      />
    </div>

    <div class="resource-gauges">
      <ResourceSummary :spoofed-counts="totalCountGaugeInput" />
      <ResourceSummary
        v-if="canAccessNodes"
        resource="node"
      />
      <ResourceSummary
        v-if="canAccessDeployments"
        resource="apps.deployment"
      />
    </div>

    <!-- extension cards -->
    <div
      v-if="extensionCards.length"
      class="extension-card-container mt-20"
    >
      <SimpleBox
        v-for="item, i in extensionCards"
        :key="`extensionCards${i}`"
        class="extension-card"
        :style="item.style"
      >
        <h3>
          {{ item.label }}
        </h3>
        <component
          :is="item.component"
          :resource="currentCluster"
        />
      </SimpleBox>
    </div>

    <h3
      v-if="hasStats"
      class="mt-40"
    >
      {{ t('clusterIndexPage.sections.capacity.label') }}
    </h3>
    <div
      v-if="hasStats"
      class="hardware-resource-gauges"
    >
      <HardwareResourceGauge
        :name="t('clusterIndexPage.hardwareResourceGauge.pods')"
        :used="podsUsed"
      />
      <HardwareResourceGauge
        :name="t('clusterIndexPage.hardwareResourceGauge.cores')"
        :reserved="cpuReserved"
        :used="cpuUsed"
        :units="cpuReserved.units"
      />
      <HardwareResourceGauge
        :name="t('clusterIndexPage.hardwareResourceGauge.ram')"
        :reserved="ramReserved"
        :used="ramUsed"
        :units="ramReserved.units"
      />
    </div>

    <div v-if="clusterServices">
      <div
        v-for="(service, i) in clusterServices"
        :key="i"
        v-clean-tooltip="service.tooltip"
        class="k8s-service-status"
        :class="{[service.status]: true }"
        :data-testid="`k8s-service-${ service.name }`"
        @click="service.goTo"
      >
        <i
          class="icon"
          :class="service.icon"
        />
        <div class="label">
          {{ t(service.labelKey) }}
        </div>
      </div>
    </div>

    <div class="mt-30">
      <Tabbed @changed="tabChange">
        <Tab
          v-if="canViewEvents"
          name="cluster-events"
          :label="t('clusterIndexPage.sections.events.label')"
          :weight="2"
        >
          <EventsTable />
        </Tab>
        <Tab
          v-if="hasMonitoring"
          name="cluster-alerts"
          :label="t('clusterIndexPage.sections.alerts.label')"
          :weight="1"
        >
          <AlertTable v-if="selectedTab === 'cluster-alerts'" />
        </Tab>
        <Tab
          name="cluster-certs"
          :label="t('clusterIndexPage.sections.certs.label')"
          :weight="1"
        >
          <span class="cert-table-link">
            <router-link :to="allSecretsLink">
              <span>{{ t('glance.secretsTable') }}</span>
            </router-link>
          </span>
          <Certificates v-if="selectedTab === 'cluster-certs'" />
        </Tab>
      </Tabbed>
    </div>
    <Tabbed
      v-if="hasMetricsTabs"
      default-tab="cluster-metrics"
      :use-hash="false"
      class="mt-30"
    >
      <Tab
        v-if="showClusterMetrics"
        name="cluster-metrics"
        :label="t('clusterIndexPage.sections.clusterMetrics.label')"
        :weight="2"
      >
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="CLUSTER_METRICS_DETAIL_URL"
            :summary-url="CLUSTER_METRICS_SUMMARY_URL"
            graph-height="825px"
          />
        </template>
      </Tab>
      <Tab
        v-if="showK8sMetrics"
        name="k8s-metrics"
        :label="t('clusterIndexPage.sections.k8sMetrics.label')"
        :weight="1"
      >
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="K8S_METRICS_DETAIL_URL"
            :summary-url="K8S_METRICS_SUMMARY_URL"
            graph-height="550px"
          />
        </template>
      </Tab>
      <Tab
        v-if="showEtcdMetrics"
        name="etcd-metrics"
        :label="t('clusterIndexPage.sections.etcdMetrics.label')"
        :weight="0"
      >
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
.extension-card-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(calc((100%/3) - 40px), 1fr));
  grid-column-gap: 15px;
  grid-row-gap: 20px;
}

.harvester-cluster-link {
  line-height: inherit;
  min-height: inherit;
  padding: 0;
  vertical-align: bottom;
}

@media only screen and (max-width: map-get($breakpoints, "--viewport-9")) {
  .extension-card-container {
    grid-template-columns: 1fr !important;
  }
}

.cluster-dashboard-glance {
  align-items: center;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 10px 0px;
  display: flex;

  &>*:not(:nth-last-child(-n+2)) {
    margin-right: 40px;

    & SPAN {
       font-weight: bold
    }
  }
}

.title {
  h1 {
    margin: 0;
  }

  .cluster-dashboard-description {
    margin: 5px 0;
    opacity: 0.7;
  }
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

.etcd-metrics :deep() .external-link {
  top: -107px;
}

.cluster-tools-tip {
  margin-top: 0;
}

.cluster-tools-link {
  display: flex;
  margin-right: 10px;

  > I {
    line-height: inherit;
    margin-right: 4px;
  }
}

.cert-table-link {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.k8s-service-status {
  align-items: center;
  display: inline-flex;
  border: 1px solid;
  border-color: var(--border);
  margin-top: 20px;

  .label {
    border-left: 1px solid var(--border);
  }

  &:not(:last-child) {
    margin-right: 20px;
  }

  > div {
    padding: 5px 20px;
  }

  > I {
    text-align: center;
    padding: 5px 10px;
  }

  &.unhealthy {
    border-color: var(--error-border);
    cursor: pointer;

    > I {
      color: var(--error)
    }
  }

  &.warning {
    cursor: pointer;

    > I {
      color: var(--warning)
    }
  }

  &.healthy {
    > I {
      color: var(--success)
    }
  }
}
</style>
