<script>
import { mapGetters } from 'vuex';
import { monitoringStatus } from '@/utils/monitoring';
import { allDashboardsExist } from '@/utils/grafana';
import CreateEditView from '@/mixins/create-edit-view';
import DashboardMetrics from '@/components/DashboardMetrics';
import ResourceTabs from '@/components/form/ResourceTabs';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';

export default {
  components: {
    DashboardMetrics, ResourceTabs, Tabbed, Tab
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      default: 'create',
      type:    String,
    },
    value: {
      required: true,
      type:     Object,
    },
  },

  async fetch() {
    this.CLUSTER_METRICS_DETAIL_URL = `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/kubewarden`;
    this.CLUSTER_METRICS_SUMMARY_URL = `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/kubewarden`;

    this.showPolicyMetrics = await allDashboardsExist(this.$store.dispatch, this.currentCluster.id, [this.CLUSTER_METRICS_DETAIL_URL, this.CLUSTER_METRICS_SUMMARY_URL]);
  },

  data() {
    return {
      showPolicyMetrics:           true,
      CLUSTER_METRICS_DETAIL_URL:  '',
      CLUSTER_METRICS_SUMMARY_URL: ''
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...monitoringStatus(),

    hasMetricsTabs() {
      return this.showPolicyMetrics;
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
      <Tabbed v-if="hasMetricsTabs" class="mt-30">
        <Tab v-if="showPolicyMetrics" name="policy-metrics" :label="`${ value.id } Metrics`" :weight="2">
          <template #default="props">
            <DashboardMetrics
              v-if="props.active"
              :detail-url="CLUSTER_METRICS_DETAIL_URL"
              :summary-url="CLUSTER_METRICS_SUMMARY_URL"
              graph-height="825px"
            />
          </template>
        </Tab>
      </Tabbed>
    </ResourceTabs>
  </div>
</template>
