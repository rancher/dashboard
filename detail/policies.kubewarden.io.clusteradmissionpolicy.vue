<script>
import { mapGetters } from 'vuex';
import { _CREATE } from '@/config/query-params';
import { SERVICE } from '@/config/types';
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

    const JAEGER_PROXY = `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/jaeger/services/http:all-in-one-query:16686/proxy/api/traces?operation=/api/traces&service=jaeger-query`;

    try {
      this.metricsService = this.monitoringStatus.installed && await dashboardExists(this.$store, this.currentCluster.id, POLICY_METRICS_DETAIL_URL);
    } catch (e) {
      console.error(`Error fetching metrics status: ${ e }`); // eslint-disable-line no-console
    }

    try {
      this.jaegerService = await this.$store.dispatch('cluster/find', { type: SERVICE, id: 'jaeger/jaeger-operator-metrics' });
      this.traces = await this.$store.dispatch(`${ inStore }/request`, { url: JAEGER_PROXY });
    } catch (e) {
      console.error(`Error fetching Jaeger service: ${ e }`); // eslint-disable-line no-console
    }
  },

  data() {
    const tracesHeaders = [
      {
        name:   'processes',
        value:  'processes.p1.serviceName',
        label:  'Processes',
        sort:   'processes'
      },
      {
        name:  'traceID',
        value: 'traceID',
        label: 'Trace ID',
        sort:  'traceID'
      }
    ];

    return {
      POLICY_METRICS_DETAIL_URL: null,
      metricsService:            null,
      jaegerService:             null,
      traces:                    null,
      tracesHeaders
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...monitoringStatus(),

    hasMetricsTabs() {
      return this.metricsService;
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
      <Tab v-if="metricsService" name="policy-metrics" label="Metrics" :weight="2">
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="POLICY_METRICS_DETAIL_URL"
            :summary-url="POLICY_METRICS_DETAIL_URL"
            graph-height="825px"
          />
        </template>
      </Tab>
      <Tab v-if="jaegerService" name="policy-tracing" label="Tracing">
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
