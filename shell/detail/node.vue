<script>
import ConsumptionGauge from '@shell/components/ConsumptionGauge';
import Alert from '@shell/components/Alert';
import SortableTable from '@shell/components/SortableTable';
import Tab from '@shell/components/Tabbed/Tab';
import {
  EFFECT,
  IMAGE_SIZE,
  KEY,
  SIMPLE_NAME,
  VALUE
} from '@shell/config/table-headers';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import EmberPage from '@shell/components/EmberPage';
import { METRIC, POD } from '@shell/config/types';
import createEditView from '@shell/mixins/create-edit-view';
import { formatSi, exponentNeeded, UNITS } from '@shell/utils/units';
import DashboardMetrics from '@shell/components/DashboardMetrics';
import { mapGetters } from 'vuex';
import { allDashboardsExist } from '@shell/utils/grafana';
import Loading from '@shell/components/Loading';
import metricPoller from '@shell/mixins/metric-poller';
import { haveV1Monitoring } from '@shell/utils/monitoring';

const NODE_METRICS_DETAIL_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-node-detail-1/rancher-node-detail?orgId=1';
const NODE_METRICS_SUMMARY_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-node-1/rancher-node?orgId=1';

export default {
  name: 'DetailNode',

  components: {
    Alert,
    ConsumptionGauge,
    DashboardMetrics,
    Loading,
    ResourceTabs,
    Tab,
    SortableTable,
    EmberPage,
  },

  mixins: [createEditView, metricPoller],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    this.showMetrics = await allDashboardsExist(this.$store, this.currentCluster.id, [NODE_METRICS_DETAIL_URL, NODE_METRICS_SUMMARY_URL]);

    if (haveV1Monitoring(this.$store.getters)) {
      const v3Nodes = await this.$store.dispatch('rancher/request', {
        url:    '/v3/nodes',
        method: 'get'
      });

      this.v3Nodes = v3Nodes;
    }

    return this.$store.dispatch('cluster/findAll', { type: POD });
  },

  data() {
    const podSchema = this.$store.getters['cluster/schemaFor'](POD);

    return {
      v3Nodes:          null,
      metrics:          { cpu: 0, memory: 0 },
      infoTableHeaders: [
        {
          ...KEY,
          label: '',
          width: 200
        },
        {
          ...VALUE,
          label:       '',
          dashIfEmpty: true,
        }
      ],
      imageTableHeaders: [
        { ...SIMPLE_NAME, width: 400 },
        IMAGE_SIZE
      ],
      taintTableHeaders: [
        KEY,
        VALUE,
        EFFECT
      ],
      podTableHeaders: this.$store.getters['type-map/headersFor'](podSchema),
      NODE_METRICS_DETAIL_URL,
      NODE_METRICS_SUMMARY_URL,
      showMetrics:     false
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    v1MonitoringUrl() {
      if (this.v3Nodes && this.v3Nodes.data) {
        const node = this.v3Nodes.data.find((n) => {
          return n.nodeName === this.value.metadata?.name;
        });

        if (node) {
          // Custom page just with node metrics graphs
          const id = this.currentCluster.id;

          return `/k/${ id }/monitoring/${ node.id }/metrics`;
        }
      }

      return null;
    },
    memoryUnits() {
      const exponent = exponentNeeded(this.value.ramCapacity, 1024);

      return `${ UNITS[exponent] }iB`;
    },

    pidPressureStatus() {
      return this.mapToStatus(this.value.isPidPressureOk);
    },

    diskPressureStatus() {
      return this.mapToStatus(this.value.isDiskPressureOk);
    },

    memoryPressureStatus() {
      return this.mapToStatus(this.value.isMemoryPressureOk);
    },

    kubeletStatus() {
      return this.mapToStatus(this.value.isKubeletOk);
    },

    infoTableRows() {
      return Object.keys(this.value.status.nodeInfo)
        .map(key => ({
          key:   this.t(`node.detail.tab.info.key.${ key }`),
          value: this.value.status.nodeInfo[key]
        }));
    },

    imageTableRows() {
      const images = this.value.status.images || [];

      return images.map(image => ({
        // image.names[1] typically has the user friendly name but on occasion there's only one name and we should use that
        name:      image.names ? (image.names[1] || image.names[0]) : '---',
        sizeBytes: image.sizeBytes
      }));
    },

    taintTableRows() {
      return this.value.spec.taints || [];
    },

    graphVars() {
      return { instance: `${ this.value.internalIp }:9796` };
    }
  },

  methods: {
    memoryFormatter(value) {
      const formatOptions = {
        addSuffix: false,
        increment: 1024,
      };

      return formatSi(value, formatOptions);
    },

    mapToStatus(isOk) {
      return isOk ? 'success' : 'error';
    },

    async loadMetrics() {
      const schema = this.$store.getters['cluster/schemaFor'](METRIC.NODE);

      if (schema) {
        await this.$store.dispatch('cluster/find', {
          type: METRIC.NODE,
          id:   this.value.id,
          opt:  { force: true }
        });

        this.$forceUpdate();
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div
    v-else
    class="node"
  >
    <div class="spacer" />
    <div class="alerts">
      <Alert
        class="mr-10"
        :status="pidPressureStatus"
        :message="t('node.detail.glance.pidPressure')"
      />
      <Alert
        class="mr-10"
        :status="diskPressureStatus"
        :message="t('node.detail.glance.diskPressure')"
      />
      <Alert
        class="mr-10"
        :status="memoryPressureStatus"
        :message="t('node.detail.glance.memoryPressure')"
      />
      <Alert
        :status="kubeletStatus"
        :message="t('node.detail.glance.kubelet')"
      />
    </div>
    <div class="mt-20 resources">
      <ConsumptionGauge
        :resource-name="t('node.detail.glance.consumptionGauge.cpu')"
        :capacity="value.cpuCapacity"
        :used="value.cpuUsage"
      />
      <ConsumptionGauge
        :resource-name="t('node.detail.glance.consumptionGauge.memory')"
        :capacity="value.ramCapacity"
        :used="value.ramUsage"
        :units="memoryUnits"
        :number-formatter="memoryFormatter"
      />
      <ConsumptionGauge
        :resource-name="t('node.detail.glance.consumptionGauge.pods')"
        :capacity="value.podCapacity"
        :used="value.podConsumed"
      />
    </div>
    <div class="spacer" />
    <ResourceTabs
      v-model="value"
      :mode="mode"
    >
      <Tab
        name="pods"
        :label="t('node.detail.tab.pods')"
        :weight="4"
      >
        <SortableTable
          key-field="_key"
          :headers="podTableHeaders"
          :rows="value.pods"
          :row-actions="false"
          :table-actions="false"
          :search="false"
        />
      </Tab>
      <Tab
        v-if="showMetrics"
        :label="t('node.detail.tab.metrics')"
        name="node-metrics"
        :weight="3"
      >
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="NODE_METRICS_DETAIL_URL"
            :summary-url="NODE_METRICS_SUMMARY_URL"
            :vars="graphVars"
            graph-height="825px"
          />
        </template>
      </Tab>
      <Tab
        name="info"
        :label="t('node.detail.tab.info.label')"
        class="bordered-table"
        :weight="2"
      >
        <SortableTable
          key-field="_key"
          :headers="infoTableHeaders"
          :rows="infoTableRows"
          :row-actions="false"
          :table-actions="false"
          :show-headers="false"
          :search="false"
        />
      </Tab>
      <Tab
        name="images"
        :label="t('node.detail.tab.images')"
        :weight="1"
      >
        <SortableTable
          key-field="_key"
          :headers="imageTableHeaders"
          :rows="imageTableRows"
          :row-actions="false"
          :table-actions="false"
        />
      </Tab>
      <Tab
        name="taints"
        :label="t('node.detail.tab.taints')"
        :weight="0"
      >
        <SortableTable
          key-field="_key"
          :headers="taintTableHeaders"
          :rows="taintTableRows"
          :row-actions="false"
          :table-actions="false"
          :search="false"
        />
      </Tab>
      <Tab
        v-if="v1MonitoringUrl"
        name="v1Metrics"
        :label="t('node.detail.tab.metrics')"
        :weight="0"
      >
        <div id="ember-anchor">
          <EmberPage
            inline="ember-anchor"
            :src="v1MonitoringUrl"
          />
        </div>
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang="scss" scoped>
.resources {
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  & > * {
    width: 30%;
  }
}
</style>
