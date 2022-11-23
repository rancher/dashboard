<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import SortableTable from '@shell/components/SortableTable';
import { STATE, SIMPLE_NAME, IMAGE } from '@shell/config/table-headers';
import { sortableNumericSuffix } from '@shell/utils/sort';
import { findBy } from '@shell/utils/array';
import DashboardMetrics from '@shell/components/DashboardMetrics';
import V1WorkloadMetrics from '@shell/mixins/v1-workload-metrics';
import { mapGetters } from 'vuex';
import { allDashboardsExist } from '@shell/utils/grafana';
import Loading from '@shell/components/Loading';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { escapeHtml } from '@shell/utils/string';

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

  computed: {
    ...mapGetters(['currentCluster']),
    containers() {
      const containers = this.allContainers;
      const statuses = this.allStatuses;

      return (containers || []).map((container) => {
        const status = findBy(statuses, 'name', container.name);
        const state = status?.state || {};
        const descriptions = [];

        // There can be only one member of a `ContainerState`
        const s = Object.values(state)[0] || {};
        const reason = s.reason || '';
        const message = s.message || '';
        const showBracket = s.reason && s.message;
        const description = `${ reason }${ showBracket ? ' (' : '' }${ message }${ showBracket ? ')' : '' }`;

        if (description) {
          descriptions.push(description);
        }

        // add lastState to show termination reason
        if (status?.lastState?.terminated) {
          const ls = status?.lastState?.terminated;
          const lsReason = ls.reason || '';
          const lsMessage = ls.message || '';
          const lsExitCode = ls.exitCode || '';
          const lsStartedAt = this.dateTimeFormat(ls.startedAt);
          const lsFinishedAt = this.dateTimeFormat(ls.finishedAt);
          const lsShowBracket = ls.reason && ls.message;
          const lsDescription = `${ lsReason }${ lsShowBracket ? ' (' : '' }${ lsMessage }${ lsShowBracket ? ')' : '' }`;

          descriptions.push(this.t('workload.container.terminationState', {
            lsDescription, lsExitCode, lsStartedAt, lsFinishedAt
          }));
        }

        return {
          ...container,
          status:           status || {},
          stateDisplay:     status ? this.value.containerStateDisplay(status) : undefined,
          stateBackground:  status ? this.value.containerStateColor(status).replace('text', 'bg') : undefined,
          nameSort:         sortableNumericSuffix(container.name).toLowerCase(),
          readyIcon:        status?.ready ? 'icon-checkmark icon-2x text-success ml-5' : 'icon-x icon-2x text-error ml-5',
          availableActions: this.value.containerActions,
          stateObj:         status, // Required if there's a description
          stateDescription: descriptions.join(' | '), // Required to display the description
          initIcon:         this.value.containerIsInit(container) ? 'icon-checkmark icon-2x text-success ml-5' : 'icon-minus icon-2x text-muted ml-5',

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
          width:         75,
          sort:          'readyIcon'
        },
        {
          ...SIMPLE_NAME,
          value: 'name'
        },
        IMAGE,
        {
          name:          'isInit',
          labelKey:      'workload.container.init',
          formatter:     'IconText',
          formatterOpts: { iconKey: 'initIcon' },
          align:         'left',
          width:         75,
          sort:          'initIcon'
        },
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
    },

    dateTimeFormatString() {
      const dateFormat = escapeHtml( this.$store.getters['prefs/get'](DATE_FORMAT));
      const timeFormat = escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));

      return `${ dateFormat } ${ timeFormat }`;
    }
  },

  methods: {
    selectionChanged(c) {
      const id = c === this.POD_OPTION ? null : c.id;

      this.metricsID = id;
      this.selection = c;
    },

    dateTimeFormat(value) {
      return value ? day(value).format(this.dateTimeFormatString) : '';
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTabs
    v-else
    mode="view"
    class="mt-20"
    :value="value"
  >
    <Tab
      :label="t('workload.container.titles.containers')"
      name="containers"
      :weight="3"
    >
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
    <Tab
      v-if="v1MonitoringUrl"
      name="v1Metrics"
      :label="t('node.detail.tab.metrics')"
      :weight="0"
    >
      <LabeledSelect
        class="pod-metrics-chooser"
        :value="selection"
        label-key="workload.metrics.metricsView"
        :options="metricsOptions"
        @input="selectionChanged($event)"
      />
      <div id="ember-anchor">
        <EmberPage
          inline="ember-anchor"
          :src="v1Metrics"
        />
      </div>
    </Tab>
    <Tab
      v-if="showMetrics"
      :label="t('workload.container.titles.metrics')"
      name="pod-metrics"
      :weight="2.5"
    >
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
