<script>
import CreateEditView from '@/mixins/create-edit-view';
import { STATE, NAME, NODE, POD_IMAGES } from '@/config/table-headers';
import { POD, WORKLOAD_TYPES } from '@/config/types';
import SortableTable from '@/components/SortableTable';
import Tab from '@/components/Tabbed/Tab';
import Loading from '@/components/Loading';
import ResourceTabs from '@/components/form/ResourceTabs';
import CountGauge from '@/components/CountGauge';
import { allHash } from '@/utils/promise';
import { get } from '@/utils/object';
import DashboardMetrics from '@/components/DashboardMetrics';
import V1WorkloadMetrics from '@/mixins/v1-workload-metrics';
import { mapGetters } from 'vuex';
import { allDashboardsExist } from '@/utils/grafana';

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

    this.showMetrics = isMetricsSupportedKind && await allDashboardsExist(this.$store.dispatch, this.currentCluster.id, [WORKLOAD_METRICS_DETAIL_URL, WORKLOAD_METRICS_SUMMARY_URL]);
  },

  data() {
    return {
      allPods: null, allJobs: [], WORKLOAD_METRICS_DETAIL_URL, WORKLOAD_METRICS_SUMMARY_URL, showMetrics: false
    };
  },

  computed:   {
    ...mapGetters(['currentCluster']),
    pods() {
      const relationships = get(this.value, 'metadata.relationships') || [];
      const podRelationship = relationships.filter(relationship => relationship.toType === POD)[0];

      if (podRelationship) {
        return this.$store.getters['cluster/matching'](POD, podRelationship.selector).filter(pod => pod?.metadata?.namespace === this.value.metadata.namespace);
      } else {
        return [];
      }
    },
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

    jobRelationships() {
      if (!this.isCronJob) {
        return;
      }

      return (get(this.value, 'metadata.relationships') || []).filter(relationship => relationship.toType === WORKLOAD_TYPES.JOB);
    },

    jobs() {
      if (!this.isCronJob) {
        return;
      }

      return this.jobRelationships.map((obj) => {
        return this.$store.getters['cluster/byId'](WORKLOAD_TYPES.JOB, obj.toId );
      }).filter(x => !!x);
    },

    jobSchema() {
      return this.$store.getters['cluster/schemaFor'](WORKLOAD_TYPES.JOB);
    },

    jobHeaders() {
      return this.$store.getters['type-map/headersFor'](this.jobSchema);
    },

    jobGauges() {
      const out = {
        succeeded: { color: 'success', count: 0 }, running: { color: 'info', count: 0 }, failed: { color: 'error', count: 0 }
      };

      if (this.value.type === WORKLOAD_TYPES.CRON_JOB) {
        this.jobs.forEach((job) => {
          const { status = {} } = job;

          out.running.count += status.active || 0;
          out.succeeded.count += status.succeeded || 0;
          out.failed.count += status.failed || 0;
        });
      } else if (this.value.type === WORKLOAD_TYPES.JOB) {
        const { status = {} } = this.value;

        out.running.count = status.active || 0;
        out.succeeded.count = status.succeeded || 0;
        out.failed.count = status.failed || 0;
      } else {
        return null;
      }

      return out;
    },

    totalRuns() {
      if (!this.jobs) {
        return;
      }

      return this.jobs.reduce((total, job) => {
        const { status = {} } = job;

        total += (status.active || 0);
        total += (status.succeeded || 0);
        total += (status.failed || 0);

        return total;
      }, 0);
    },

    podRestarts() {
      return this.pods.reduce((total, pod) => {
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

    podGauges() {
      const out = {
        active: { color: 'success' }, transitioning: { color: 'info' }, warning: { color: 'warning' }, error: { color: 'error' }
      };

      if (!this.pods) {
        return out;
      }

      this.pods.map((pod) => {
        const { status:{ phase } } = pod;
        let group;

        switch (phase) {
        case 'Running':
          group = 'active';
          break;
        case 'Pending':
          group = 'transitioning';
          break;
        case 'Failed':
          group = 'error';
          break;
        default:
          group = 'warning';
        }

        out[group].count ? out[group].count++ : out[group].count = 1;
      });

      return out;
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
    <div v-if="pods || jobGauges" class="gauges mb-20">
      <template v-if="jobGauges">
        <CountGauge
          v-for="(group, key) in jobGauges"
          :key="key"
          :total="isCronJob? totalRuns : pods.length"
          :useful="group.count || 0"
          :primary-color-var="`--sizzle-${group.color}`"
          :name="t(`workload.gaugeStates.${key}`)"
        />
      </template>
      <template v-else>
        <CountGauge
          v-for="(group, key) in podGauges"
          :key="key"
          :total="pods.length"
          :useful="group.count || 0"
          :primary-color-var="`--sizzle-${group.color}`"
          :name="t(`workload.gaugeStates.${key}`)"
        />
      </template>
    </div>
    <ResourceTabs :value="value">
      <Tab v-if="isCronJob" name="jobs" :label="t('tableHeaders.jobs')" :weight="4">
        <SortableTable
          :rows="jobs"
          :headers="jobHeaders"
          key-field="id"
          :schema="jobSchema"
          :show-groups="false"
          :search="false"
        />
      </Tab>
      <Tab v-else name="pods" :label="t('tableHeaders.pods')" :weight="4">
        <SortableTable
          v-if="pods"
          :rows="pods"
          :headers="podHeaders"
          key-field="id"
          :table-actions="false"
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
}
</style>
