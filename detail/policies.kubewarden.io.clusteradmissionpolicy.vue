<script>
import { mapGetters } from 'vuex';
import { monitoringStatus } from '@/utils/monitoring';
// import { allDashboardsExist } from '@/utils/grafana';
import CreateEditView from '@/mixins/create-edit-view';
import DashboardMetrics from '@/components/DashboardMetrics';
import ResourceTabs from '@/components/form/ResourceTabs';
import ResourceTable from '@/components/ResourceTable';
import Tab from '@/components/Tabbed/Tab';

export default {
  components: {
    DashboardMetrics, ResourceTabs, ResourceTable, Tab
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      default: 'create',
      type:    String,
    },
    resource: {
      type:    String,
      default: null
    },
    value: {
      required: true,
      type:     Object,
    },
  },

  async fetch() {
    const inStore = this.$store.getters['currentStore'](this.resource);

    // If on a local server with metrics or developing locally you need to remove /k8s/clusters/${ this.currentCluster } from the url
    this.POLICY_METRICS_DETAIL_URL = `/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/r3Pw-1O7z/kubewarden?orgId=1&refresh=30s`;

    // For downstream clusters
    // this.POLICY_METRICS_DETAIL_URL = `/k8s/clusters/${ this.currentCluster }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/r3Pw-1O7z/kubewarden?orgId=1&refresh=30s`;
    // this.showPolicyMetrics = await allDashboardsExist(this.$store.dispatch, this.currentCluster.id, [this.POLICY_METRICS_DETAIL_URL, this.POLICY_METRICS_SUMMARY_URL]);
    const JAEGER_PROXY = `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/jaeger/services/http:all-in-one-query:16686/proxy/api/traces?operation=/api/traces&service=jaeger-query`;

    this.traces = await this.$store.dispatch(`${ inStore }/request`, { url: JAEGER_PROXY });
  },

  data() {
    return {
      showPolicyMetrics:          false,
      showPolicyTracing:          true,
      traces:                     null,
      POLICY_METRICS_DETAIL_URL:  null,
      // POLICY_METRICS_SUMMARY_URL: ''
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
