<script>
import { mapGetters } from 'vuex';
import flatMap from 'lodash/flatMap';
import { _CREATE } from '@shell/config/query-params';
import { monitoringStatus } from '@shell/utils/monitoring';
import { dashboardExists } from '@shell/utils/grafana';
import CreateEditView from '@shell/mixins/create-edit-view';

import DashboardMetrics from '@shell/components/DashboardMetrics';
import Loading from '@shell/components/Loading';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';

import TraceTable from '../components/TraceTable';

export default {
  name: 'ClusterAdmissionPolicy',

  components: {
    DashboardMetrics, Loading, ResourceTabs, Tab, TraceTable
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
    this.metricsProxy = await this.value.grafanaProxy();

    if ( this.monitoringStatus.installed ) {
      try {
        this.metricsProxy = await this.value.grafanaProxy();

        if ( this.metricsProxy ) {
          this.metricsService = await dashboardExists(this.$store, this.currentCluster?.id, this.metricsProxy);
        }
      } catch (e) {
        console.error(`Error fetching Grafana service: ${ e }`); // eslint-disable-line no-console
      }
    }

    this.traces = await this.value.jaegerProxy();

    if ( this.traces.length > 1 ) {
      this.traces = flatMap(this.traces);
    }
  },

  data() {
    return {
      metricsProxy:   null,
      metricsService: null,
      monitorTraces:  null,
      protectTraces:  null,
      traces:         null
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...monitoringStatus(),

    dashboardVars() {
      return { policy_name: `clusterwide-${ this.value?.id }` };
    },

    hasMetricsTabs() {
      return this.metricsService;
    },

    hasRelationships() {
      return !!this.value.metadata?.relationships;
    },

    tracesRows() {
      return this.value.traceTableRows(this.traces);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="mb-20">
      <h3>{{ t('namespace.resources') }}</h3>
    </div>
    <ResourceTabs v-model="value" :mode="mode" :need-related="hasRelationships">
      <Tab v-if="metricsService" name="policy-metrics" label="Metrics" :weight="99">
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="metricsProxy"
            :summary-url="metricsProxy"
            :vars="dashboardVars"
            graph-height="825px"
          />
        </template>
      </Tab>
      <Tab v-if="traces" name="policy-tracing" label="Tracing" :weight="98">
        <TraceTable
          :rows="tracesRows"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>
