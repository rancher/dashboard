<script>
import CreateEditView from '@/mixins/create-edit-view';
import Tab from '@/components/Tabbed/Tab';
import ResourceTabs from '@/components/form/ResourceTabs';
import SortableTable from '@/components/SortableTable';
import { STATE, SIMPLE_NAME, IMAGE } from '@/config/table-headers';
import { sortableNumericSuffix } from '@/utils/sort';
import { findBy } from '@/utils/array';
import DashboardMetrics from '@/components/DashboardMetrics';
import V1WorkloadMetrics from '@/mixins/v1-workload-metrics';
import { mapGetters } from 'vuex';
import { allDashboardsExist } from '@/utils/grafana';
import Loading from '@/components/Loading';

const POD_METRICS_DETAIL_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-pod-containers-1/rancher-pod-containers?orgId=1';
const POD_METRICS_SUMMARY_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-pod-1/rancher-pod?orgId=1';

export default {
  name: 'PodDetail',

  components: {
    DashboardMetrics,
    Loading,
    ResourceTabs,
    Tab,
    SortableTable,
  },

  mixins: [CreateEditView, V1WorkloadMetrics],

  async fetch() {
    this.showMetrics = await allDashboardsExist(this.$store.dispatch, this.currentCluster.id, [POD_METRICS_DETAIL_URL, POD_METRICS_SUMMARY_URL]);
  },

  data() {
    return {
      POD_METRICS_DETAIL_URL,
      POD_METRICS_SUMMARY_URL,
      showMetrics: false
    };
  },

  computed:   {
    ...mapGetters(['currentCluster']),
    containers() {
      const { containerStatuses = [] } = this.value.status;

      return (this.value.spec.containers || []).map((container) => {
        container.status = findBy(containerStatuses, 'name', container.name) || {};
        container.stateDisplay = this.value.containerStateDisplay(container);
        container.stateBackground = this.value.containerStateColor(container).replace('text', 'bg');
        container.nameSort = sortableNumericSuffix(container.name).toLowerCase();
        container.readyIcon = container?.status?.ready ? 'icon-checkmark icon-2x text-success ml-5' : 'icon-x icon-2x text-error ml-5';

        return container;
      });
    },

    containerHeaders() {
      return [
        STATE,
        {
          name:          'ready',
          labelKey:      'tableHeaders.ready',
          formatter:     'IconText',
          formatterOpts: { iconKey: 'readyIcon' },
          align:         'left',
          width:         75
        },
        {
          ...SIMPLE_NAME,
          value: 'name'
        },
        IMAGE,
        {
          name:     'restarts',
          labelKey: 'tableHeaders.restarts',
          value:    'status.restartCount',
          align:    'right',
          width:    75
        },
        {
          name:          'age',
          labelKey:      'tableHeaders.started',
          value:         'status.state.running.startedAt',
          sort:          'status.state.running.startedAt:desc',
          search:        false,
          formatter:     'LiveDate',
          formatterOpts: { addSuffix: true },
          align:         'right'
        }
      ];
    },

    graphVars() {
      return {
        namespace: this.value.namespace,
        pod:       this.value.name
      };
    },

  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTabs v-else mode="view" class="mt-20" :value="value">
    <Tab :label="t('workload.container.titles.containers')" name="containers" :weight="3">
      <SortableTable
        :rows="containers"
        :headers="containerHeaders"
        :mode="mode"
        key-field="name"
        :search="false"
        :row-actions="false"
        :table-actions="false"
      />
    </Tab>
    <Tab v-if="v1MonitoringUrl" name="v1Metrics" :label="t('node.detail.tab.metrics')" :weight="0">
      <div id="ember-anchor">
        <EmberPage inline="ember-anchor" :fixed="false" :src="v1MonitoringUrl" />
      </div>
    </Tab>
    <Tab v-if="showMetrics" :label="t('workload.container.titles.metrics')" name="pod-metrics" :weight="2.5">
      <template #default="props">
        <DashboardMetrics
          v-if="props.active"
          :detail-url="POD_METRICS_DETAIL_URL"
          :summary-url="POD_METRICS_SUMMARY_URL"
          :vars="graphVars"
          graph-height="550px"
        />
      </template>
    </Tab>
  </ResourceTabs>
</template>
