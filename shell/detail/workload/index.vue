<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { STATE, NAME, NODE, POD_IMAGES } from '@shell/config/table-headers';
import { POD, WORKLOAD_TYPES } from '@shell/config/types';
import SortableTable from '@shell/components/SortableTable';
import Tab from '@shell/components/Tabbed/Tab';
import Loading from '@shell/components/Loading';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import CountGauge from '@shell/components/CountGauge';
import { allHash } from '@shell/utils/promise';
import DashboardMetrics from '@shell/components/DashboardMetrics';
import V1WorkloadMetrics from '@shell/mixins/v1-workload-metrics';
import { mapGetters } from 'vuex';
import { allDashboardsExist } from '@shell/utils/grafana';

const WORKLOAD_METRICS_DETAIL_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-workload-pods-1/rancher-workload-pods?orgId=1';
const WORKLOAD_METRICS_SUMMARY_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-workload-1/rancher-workload?orgId=1';

export const WORKLOAD_TYPE_TO_KIND_MAPPING = {
  // Each deployment creates a replicaset and the metrics are published for a replicaset.
  [WORKLOAD_TYPES.DEPLOYMENT]:             'ReplicaSet',
  [WORKLOAD_TYPES.CRON_JOB]:               'CronJob',
  [WORKLOAD_TYPES.DAEMON_SET]:             'DaemonSet',
  [WORKLOAD_TYPES.JOB]:                    'Job',
  [WORKLOAD_TYPES.STATEFUL_SET]:           'StatefulSet',
  [WORKLOAD_TYPES.REPLICA_SET]:            'ReplicaSet',
  [WORKLOAD_TYPES.REPLICATION_CONTROLLER]: 'ReplicationController',
};

const METRICS_SUPPORTED_KINDS = [
  WORKLOAD_TYPES.DAEMON_SET,
  WORKLOAD_TYPES.REPLICA_SET,
  WORKLOAD_TYPES.STATEFUL_SET,
  WORKLOAD_TYPES.DEPLOYMENT
];

export default {
  components: {
    DashboardMetrics,
    Tab,
    Loading,
    ResourceTabs,
    CountGauge,
    SortableTable
  },

  mixins: [CreateEditView, V1WorkloadMetrics],

  async fetch() {
    const hash = { allPods: this.$store.dispatch('cluster/findAll', { type: POD }) };

    if (this.value.type === WORKLOAD_TYPES.CRON_JOB) {
      hash.allJobs = this.$store.dispatch('cluster/findAll', { type: WORKLOAD_TYPES.JOB });
    }
    const res = await allHash(hash);

    for ( const k in res ) {
      this[k] = res[k];
    }

    const isMetricsSupportedKind = METRICS_SUPPORTED_KINDS.includes(this.value.type);

    this.showMetrics = isMetricsSupportedKind && await allDashboardsExist(this.$store, this.currentCluster.id, [WORKLOAD_METRICS_DETAIL_URL, WORKLOAD_METRICS_SUMMARY_URL]);
  },

  data() {
    return {
      allPods: null, allJobs: [], WORKLOAD_METRICS_DETAIL_URL, WORKLOAD_METRICS_SUMMARY_URL, showMetrics: false
    };
  },

  computed:   {
    ...mapGetters(['currentCluster']),

    isJob() {
      return this.value.type === WORKLOAD_TYPES.JOB;
    },

    isCronJob() {
      return this.value.type === WORKLOAD_TYPES.CRON_JOB;
    },

    podSchema() {
      return this.$store.getters['cluster/schemaFor'](POD);
    },

    podTemplateSpec() {
      const isCronJob = this.value.type === WORKLOAD_TYPES.CRON_JOB;

      if ( isCronJob ) {
        return this.value.spec.jobTemplate.spec.template.spec;
      } else {
        return this.value.spec?.template?.spec;
      }
    },

    container() {
      return this.podTemplateSpec?.containers[0];
    },

    jobSchema() {
      return this.$store.getters['cluster/schemaFor'](WORKLOAD_TYPES.JOB);
    },

    jobHeaders() {
      return this.$store.getters['type-map/headersFor'](this.jobSchema);
    },

    totalRuns() {
      if (!this.value.jobs) {
        return;
      }

      return this.value.jobs.reduce((total, job) => {
        const { status = {} } = job;

        total += (status.active || 0);
        total += (status.succeeded || 0);
        total += (status.failed || 0);

        return total;
      }, 0);
    },

    podRestarts() {
      return this.value.pods.reduce((total, pod) => {
        const { status:{ containerStatuses = [] } } = pod;

        if (containerStatuses.length) {
          total += containerStatuses.reduce((tot, container) => {
            tot += container.restartCount;

            return tot;
          }, 0);
        }

        return total;
      }, 0);
    },

    podHeaders() {
      return [
        STATE,
        NAME,
        NODE,
        POD_IMAGES
      ];
    },

    graphVarsWorkload() {
      return this.value.type === WORKLOAD_TYPES.DEPLOYMENT ? this.value.replicaSetId : this.value.shortId;
    },

    graphVars() {
      return {
        namespace: this.value.namespace,
        kind:      WORKLOAD_TYPE_TO_KIND_MAPPING[this.value.type],
        workload:  this.graphVarsWorkload
      };
    },

    showPodGaugeCircles() {
      const podGauges = Object.values(this.value.podGauges);
      const total = this.value.pods.length;

      return !podGauges.find(pg => pg.count === total);
    },

    showJobGaugeCircles() {
      const jobGauges = Object.values(this.value.jobGauges);
      const total = this.isCronJob ? this.totalRuns : this.value.pods.length;

      return !jobGauges.find(jg => jg.count === total);
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h3>
      {{ isJob || isCronJob ? t('workload.detailTop.runs') :t('workload.detailTop.pods') }}
    </h3>
    <div v-if="value.pods || value.jobGauges" class="gauges mb-20" :class="{'gauges__pods': !!value.pods}">
      <template v-if="value.jobGauges">
        <CountGauge
          v-for="(group, key) in value.jobGauges"
          :key="key"
          :total="isCronJob? totalRuns : value.pods.length"
          :useful="group.count || 0"
          :graphical="showJobGaugeCircles"
          :primary-color-var="`--sizzle-${group.color}`"
          :name="t(`workload.gaugeStates.${key}`)"
        />
      </template>
      <template v-else>
        <CountGauge
          v-for="(group, key) in value.podGauges"
          :key="key"
          :total="value.pods.length"
          :useful="group.count || 0"
          :graphical="showPodGaugeCircles"
          :primary-color-var="`--sizzle-${group.color}`"
          :name="key"
        />
      </template>
    </div>
    <ResourceTabs :value="value">
      <Tab v-if="isCronJob" name="jobs" :label="t('tableHeaders.jobs')" :weight="4">
        <SortableTable
          :rows="value.jobs"
          :headers="jobHeaders"
          key-field="id"
          :schema="jobSchema"
          :show-groups="false"
          :search="false"
        />
      </Tab>
      <Tab v-else name="pods" :label="t('tableHeaders.pods')" :weight="4">
        <SortableTable
          v-if="value.pods"
          :rows="value.pods"
          :headers="podHeaders"
          key-field="id"
          :schema="podSchema"
          :groupable="false"
          :search="false"
        />
      </Tab>
      <Tab v-if="showMetrics" :label="t('workload.container.titles.metrics')" name="workload-metrics" :weight="3">
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="WORKLOAD_METRICS_DETAIL_URL"
            :summary-url="WORKLOAD_METRICS_SUMMARY_URL"
            :vars="graphVars"
            graph-height="550px"
          />
        </template>
      </Tab>
      <Tab v-if="v1MonitoringUrl" name="v1Metrics" :label="t('node.detail.tab.metrics')" :weight="10">
        <div id="ember-anchor">
          <EmberPage inline="ember-anchor" :src="v1MonitoringUrl" />
        </div>
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang='scss' scoped>
.gauges {
  display: flex;
  justify-content: space-around;
  &>*{
    flex: 1;
    margin-right: $column-gutter;
  }
  &__pods {
    flex-wrap: wrap;
    justify-content: left;
    .count-gauge {
      width: 23%;
      margin-bottom: 10px;
      flex: initial;
    }
  }
}
</style>
