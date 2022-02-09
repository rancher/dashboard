<script>
import { mapGetters } from 'vuex';
import { _CREATE } from '@/config/query-params';
import { monitoringStatus } from '@/utils/monitoring';
import { dashboardExists } from '@/utils/grafana';
import CreateEditView from '@/mixins/create-edit-view';
import DashboardMetrics from '@/components/DashboardMetrics';
import ResourceTabs from '@/components/form/ResourceTabs';
import ResourceTable from '@/components/ResourceTable';
import Tab from '@/components/Tabbed/Tab';

// The uid in the proxy `r3Pw-107z` is setup in the configmap for the kubewarden dashboard
// It's the generic uid from the json here: https://grafana.com/grafana/dashboards/15314
const POLICY_METRICS_DETAIL_URL = `/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/r3Pw-1O7z/kubewarden?orgId=1&refresh=30s`;
const JAEGER_PROXY = `/api/v1/namespaces/jaeger/services/http:all-in-one-query:16686/proxy/api/traces?operation=/api/traces&service=jaeger-query`;

export default {
  name: 'ClusterAdmissionPolicy',

  components: {
    DashboardMetrics, ResourceTabs, ResourceTable, Tab
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:    String,
      default: _CREATE,
    },
    resource: {
      type:    String,
      default: null
    },
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const inStore = this.$store.getters['currentStore'](this.resource);

    this.showPolicyMetrics = this.monitoringStatus.installed && await dashboardExists(this.$store, this.currentCluster.id, POLICY_METRICS_DETAIL_URL);

    this.traces = await this.$store.dispatch(`${ inStore }/request`, { url: JAEGER_PROXY });
  },

  data() {
    return {
      showPolicyMetrics:          false,
      showPolicyTracing:          false,
      traces:                     null,
      POLICY_METRICS_DETAIL_URL,
      JAEGER_PROXY
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...monitoringStatus(),

    hasMetricsTabs() {
      return this.showPolicyMetrics;
    },

    tracesHeaders() {
      return [
        {
          name:   'processes',
          value:  'processes.p1.serviceName',
          label:  'Processes',
          sort:   'processes'
        },
      ];
    },

    tracesRows() {
      return this.traces?.data;
    }
  }
};
</script>

<template>
  <div>
    <div class="mb-20">
      <h3>{{ t('namespace.resources') }}</h3>
    </div>
    <ResourceTabs v-model="value" :mode="mode">
      <Tab v-if="showPolicyMetrics" name="policy-metrics" label="Metrics" :weight="2">
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="POLICY_METRICS_DETAIL_URL"
            :summary-url="POLICY_METRICS_DETAIL_URL"
            graph-height="825px"
          />
        </template>
      </Tab>
      <Tab v-if="showPolicyTracing" name="policy-tracing" label="Tracing" :weight="1">
        <template #default>
          <ResourceTable
            v-if="traces"
            :rows="tracesRows"
            :headers="tracesHeaders"
            :table-actions="false"
            :row-actions="false"
            key-field="key"
            default-sort-by="state"
            :paged="true"
          />
        </template>
      </Tab>
    </ResourceTabs>
  </div>
</template>
