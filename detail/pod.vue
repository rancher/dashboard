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
import LabeledSelect from '@/components/form/LabeledSelect';

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
    LabeledSelect,
  },

  mixins: [CreateEditView, V1WorkloadMetrics],

  async fetch() {
    this.showMetrics = await allDashboardsExist(this.$store, this.currentCluster.id, [POD_METRICS_DETAIL_URL, POD_METRICS_SUMMARY_URL]);
  },

  data() {
    const t = this.$store.getters['i18n/t'];
    const POD_OPTION = {
      id:    '//POD//',
      label: t('workload.metrics.pod'),
    };

    return {
      POD_METRICS_DETAIL_URL,
      POD_METRICS_SUMMARY_URL,
      POD_OPTION,
      showMetrics: false,
      selection:   POD_OPTION,
      metricsID:   null,
    };
  },

  computed:   {
    ...mapGetters(['currentCluster']),
    containers() {
      const containers = this.allContainers;
      const statuses = this.allStatuses;

      return (containers || []).map((container) => {
        const status = findBy(statuses, 'name', container.name);

        return {
          ...container,
          status:           status || {},
          stateDisplay:     this.value.containerStateDisplay(container),
          stateBackground:  this.value.containerStateColor(container).replace('text', 'bg'),
          nameSort:         sortableNumericSuffix(container.name).toLowerCase(),
          readyIcon:        container?.status?.ready ? 'icon-checkmark icon-2x text-success ml-5' : 'icon-x icon-2x text-error ml-5',
          availableActions: this.value.containerActions,
          stateObj:         status, // Required if there's a description
          stateDescription: status, // Required to display the description

          // Call openShell here so that opening the shell
          // at the container level still has 'this' in scope.
          openShell: () => this.value.openShell(container.name),
          // Call openLogs here so that opening the logs
          // at the container level still has 'this' in scope.
          openLogs:  () => this.value.openLogs(container.name)
        };
      });
    },

    allContainers() {
      const { containers = [], initContainers = [] } = this.value.spec;

      return [...containers, ...initContainers];
    },

    allStatuses() {
      const { containerStatuses = [], initContainerStatuses = [] } = this.value.status;

      return [...containerStatuses, ...initContainerStatuses];
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

    metricsOptions() {
      const v = this.containers.map((c) => {
        return {
          id:    c.name,
          label: c.name
        };
      });

      v.unshift(this.POD_OPTION);

      return v;
    },

    v1Metrics() {
      if (!this.metricsID) {
        return this.v1MonitoringUrl;
      } else {
        return `${ this.v1MonitoringContainerBaseUrl }/${ this.metricsID }`;
      }
    }
  },

  methods: {
    selectionChanged(c) {
      const id = c === this.POD_OPTION ? null : c.id;

      this.metricsID = id;
      this.selection = c;
    },

    // getStateDescription(status) {
    //   console.log(status);
    //   // const states = status
    //   //   .map(({ state }) => state)
    //   //   .map(({ error, message }) => [error, message]);
    //   // const description = flatten(compact(states))
    //   //   .map(({ reason, message }) => `${ reason }:${ message }`);

    //   return 'this is a description';
    //   // return description;
    // }
  }
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
        :row-actions="true"
        :table-actions="false"
      />
    </Tab>
    <Tab v-if="v1MonitoringUrl" name="v1Metrics" :label="t('node.detail.tab.metrics')" :weight="0">
      <LabeledSelect
        class="pod-metrics-chooser"
        :value="selection"
        label-key="workload.metrics.metricsView"
        :options="metricsOptions"
        @input="selectionChanged($event)"
      />
      <div id="ember-anchor">
        <EmberPage inline="ember-anchor" :src="v1Metrics" />
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
<style scoped>
  .pod-metrics-chooser {
    width: fit-content;
    margin-bottom: 10px;
    min-width: 300px;
  }
</style>
