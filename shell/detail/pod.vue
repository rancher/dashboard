<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import SortableTable from '@shell/components/SortableTable';
import { STATE, SIMPLE_NAME, IMAGE_NAME } from '@shell/config/table-headers';
import { sortableNumericSuffix } from '@shell/utils/sort';
import { findBy } from '@shell/utils/array';
import DashboardMetrics from '@shell/components/DashboardMetrics';
import { mapGetters } from 'vuex';
import { allDashboardsExist } from '@shell/utils/grafana';
import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { escapeHtml } from '@shell/utils/string';
import { NAMESPACE } from '@shell/config/types';
import { PROJECT } from '@shell/config/labels-annotations';

const POD_METRICS_DETAIL_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-pod-containers-1/rancher-pod-containers?orgId=1';
const POD_METRICS_SUMMARY_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-pod-1/rancher-pod?orgId=1';

export default {
  name: 'PodDetail',

  components: {
    DashboardMetrics,
    ResourceTabs,
    Tab,
    SortableTable,
  },

  mixins: [CreateEditView],

  async fetch() {
    this.showMetrics = await allDashboardsExist(this.$store, this.currentCluster.id, [POD_METRICS_DETAIL_URL, POD_METRICS_SUMMARY_URL]);
    if (!this.showMetrics) {
      const namespace = await this.$store.dispatch('cluster/find', { type: NAMESPACE, id: this.value.metadata.namespace });

      const projectId = namespace?.metadata?.labels[PROJECT];

      if (projectId) {
        this.POD_PROJECT_METRICS_DETAIL_URL = `/api/v1/namespaces/cattle-project-${ projectId }-monitoring/services/http:cattle-project-${ projectId }-monitoring-grafana:80/proxy/d/rancher-pod-containers-1/rancher-pod-containers?orgId=1'`;
        this.POD_PROJECT_METRICS_SUMMARY_URL = `/api/v1/namespaces/cattle-project-${ projectId }-monitoring/services/http:cattle-project-${ projectId }-monitoring-grafana:80/proxy/d/rancher-pod-1/rancher-pod?orgId=1`;

        this.showProjectMetrics = await allDashboardsExist(this.$store, this.currentCluster.id, [this.POD_PROJECT_METRICS_DETAIL_URL, this.POD_PROJECT_METRICS_SUMMARY_URL], 'cluster', projectId);
      }
    }
  },

  data() {
    return {
      POD_METRICS_DETAIL_URL,
      POD_METRICS_SUMMARY_URL,
      POD_PROJECT_METRICS_DETAIL_URL:  '',
      POD_PROJECT_METRICS_SUMMARY_URL: '',
      showMetrics:                     false,
      showProjectMetrics:              false,
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
          readyIcon:        status?.ready ? 'icon-checkmark text-success ml-5' : 'icon-x text-error ml-5',
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
        IMAGE_NAME,
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

    dateTimeFormatString() {
      const dateFormat = escapeHtml( this.$store.getters['prefs/get'](DATE_FORMAT));
      const timeFormat = escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));

      return `${ dateFormat } ${ timeFormat }`;
    }
  },

  methods: {
    dateTimeFormat(value) {
      return value ? day(value).format(this.dateTimeFormatString) : '';
    }
  }
};
</script>

<template>
  <ResourceTabs
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
    <Tab
      v-if="showProjectMetrics"
      :label="t('workload.container.titles.metrics')"
      name="pod-metrics"
      :weight="2.5"
    >
      <template #default="props">
        <DashboardMetrics
          v-if="props.active"
          :detail-url="POD_PROJECT_METRICS_DETAIL_URL"
          :summary-url="POD_PROJECT_METRICS_SUMMARY_URL"
          :vars="graphVars"
          graph-height="550px"
        />
      </template>
    </Tab>
  </ResourceTabs>
</template>
