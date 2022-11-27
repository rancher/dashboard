<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { NAMESPACE as NAMESPACE_COL } from '@shell/config/table-headers';
import {
  POD, WORKLOAD_TYPES, SCALABLE_WORKLOAD_TYPES, SERVICE, INGRESS, NODE
} from '@shell/config/types';
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
import PlusMinus from '@shell/components/form/PlusMinus';
import { matches } from '~shell/utils/selector';

const SCALABLE_TYPES = Object.values(SCALABLE_WORKLOAD_TYPES);
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
    SortableTable,
    PlusMinus
  },

  mixins: [CreateEditView, V1WorkloadMetrics],

  async fetch() {
    let hasNodes = false;

    try {
      const inStore = this.$store.getters['currentStore']();
      const schema = this.$store.getters[`${ inStore }/schemaFor`](NODE);

      if (schema) {
        hasNodes = true;
      }
    } catch {}

    const hash = {
      allPods:      this.$store.dispatch('cluster/findAll', { type: POD }),
      allServices:  this.$store.dispatch('cluster/findAll', { type: SERVICE }),
      allIngresses: this.$store.dispatch('cluster/findAll', { type: INGRESS }),
      // Nodes should be fetched because they may be referenced in the target
      // column of a service list item.
      allNodes:     hasNodes ? this.$store.dispatch('cluster/findAll', { type: NODE }) : []
    };

    if (this.value.type === WORKLOAD_TYPES.CRON_JOB) {
      hash.allJobs = this.$store.dispatch('cluster/findAll', { type: WORKLOAD_TYPES.JOB });
    }
    const res = await allHash(hash);

    for ( const k in res ) {
      this[k] = res[k];
    }

    const isMetricsSupportedKind = METRICS_SUPPORTED_KINDS.includes(this.value.type);

    this.showMetrics = isMetricsSupportedKind && await allDashboardsExist(this.$store, this.currentCluster.id, [WORKLOAD_METRICS_DETAIL_URL, WORKLOAD_METRICS_SUMMARY_URL]);

    this.findMatchingServices();
    this.findMatchingIngresses();
  },

  data() {
    return {
      allPods:           [],
      allServices:       [],
      allIngresses:      [],
      matchingServices:  [],
      matchingIngresses: [],
      allJobs:           [],
      allNodes:          [],
      WORKLOAD_METRICS_DETAIL_URL,
      WORKLOAD_METRICS_SUMMARY_URL,
      showMetrics:       false,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    isActive() {
      return this.value.metadata.state.name === 'active';
    },

    isJob() {
      return this.value.type === WORKLOAD_TYPES.JOB;
    },

    isCronJob() {
      return this.value.type === WORKLOAD_TYPES.CRON_JOB;
    },

    isPod() {
      return this.value.type === POD;
    },

    podSchema() {
      return this.$store.getters['cluster/schemaFor'](POD);
    },

    ingressSchema() {
      return this.$store.getters['cluster/schemaFor'](INGRESS);
    },

    serviceSchema() {
      return this.$store.getters['cluster/schemaFor'](SERVICE);
    },

    podTemplateSpec() {
      if ( this.value.type === WORKLOAD_TYPES.CRON_JOB ) {
        return this.value.spec.jobTemplate.spec.template.spec;
      }

      // This is for viewing
      if ( this.value.type === POD ) {
        return this.value;
      }

      return this.value.spec?.template?.spec;
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
    ingressHeaders() {
      return this.$store.getters['type-map/headersFor'](this.ingressSchema);
    },
    serviceHeaders() {
      return this.$store.getters['type-map/headersFor'](this.serviceSchema);
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
      return this.$store.getters['type-map/headersFor'](this.podSchema).filter(h => h !== NAMESPACE_COL);
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
    },

    canScale() {
      return !!SCALABLE_TYPES.includes(this.value.type) && this.value.canUpdate;
    },
  },
  methods: {
    async scale(isUp) {
      try {
        if (isUp) {
          await this.value.scaleUp();
        } else {
          await this.value.scaleDown();
        }
      } catch (err) {
        this.$store.dispatch('growl/fromError', {
          title: this.t('workload.list.errorCannotScale', { direction: isUp ? 'up' : 'down', workloadName: this.value.name }),
          err
        },
        { root: true });
      }
    },
    async scaleDown() {
      await this.scale(false);
    },
    async scaleUp() {
      await this.scale(true);
    },
    findMatchingServices() {
      if (!this.serviceSchema) {
        return [];
      }
      const matchingPods = this.value.pods;

      // Find Services that have selectors that match this
      // workload's Pod(s).
      const matchingServices = this.allServices.filter((service) => {
        const selector = service.spec.selector;

        for (let i = 0; i < matchingPods.length; i++) {
          const pod = matchingPods[i];

          if (service.metadata?.namespace === this.value.metadata?.namespace && matches(pod, selector)) {
            return true;
          }
        }

        return false;
      });

      this.matchingServices = matchingServices;
    },
    findMatchingIngresses() {
      if (!this.ingressSchema) {
        return [];
      }

      // Find Ingresses that forward traffic to Services
      // that select this workload.
      const matchingIngresses = this.allIngresses.filter((ingress) => {
        const rules = ingress.spec.rules;

        if (rules) {
          for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];

            const paths = rule.http.paths;

            if (paths) {
              // For each Ingress, check if any Services that match
              // this workload are also target backends for the Ingress.
              for (let j = 0; j < paths.length; j++) {
                const pathData = paths[j];
                const targetServiceName = pathData.backend.service.name;

                for (let k = 0; k < this.matchingServices.length; k++) {
                  const service = this.matchingServices[k];
                  const matchingServiceName = service.metadata?.name;

                  if (ingress.metadata?.namespace === this.value.metadata?.namespace && matchingServiceName === targetServiceName) {
                    return true;
                  }
                }
              }
            }
          }
        }

        return false;
      });

      this.matchingIngresses = matchingIngresses;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div
      v-if="canScale"
      class="right-align flex"
    >
      <PlusMinus
        class="text-right"
        :label="t('tableHeaders.scale')"
        :value="value.spec.replicas"
        :disabled="!isActive"
        @minus="scaleDown"
        @plus="scaleUp"
      />
    </div>
    <h3>
      {{ isJob || isCronJob ? t('workload.detailTop.runs') :t('workload.detailTop.pods') }}
    </h3>
    <div
      v-if="value.pods || value.jobGauges"
      class="gauges mb-20"
      :class="{'gauges__pods': !!value.pods}"
    >
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
    <ResourceTabs
      :value="value"
      :always-show-events="true"
    >
      <Tab
        v-if="isCronJob"
        name="jobs"
        :label="t('tableHeaders.jobs')"
        :weight="4"
      >
        <SortableTable
          :rows="value.jobs"
          :headers="jobHeaders"
          key-field="id"
          :schema="jobSchema"
          :show-groups="false"
          :search="false"
        />
      </Tab>
      <Tab
        v-else
        name="pods"
        :label="t('tableHeaders.pods')"
        :weight="4"
      >
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
      <Tab
        v-if="showMetrics"
        :label="t('workload.container.titles.metrics')"
        name="workload-metrics"
        :weight="3"
      >
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
      <Tab
        v-if="v1MonitoringUrl"
        name="v1Metrics"
        :label="t('node.detail.tab.metrics')"
        :weight="10"
      >
        <div id="ember-anchor">
          <EmberPage
            inline="ember-anchor"
            :src="v1MonitoringUrl"
          />
        </div>
      </Tab>
      <Tab
        v-if="!isJob && !isCronJob"
        name="services"
        :label="t('workload.detail.services')"
        :weight="3"
      >
        <p
          v-if="!serviceSchema"
          class="caption"
        >
          {{ t('workload.detail.cannotViewServices') }}
        </p>
        <p
          v-else-if="matchingServices.length === 0"
          class="caption"
        >
          {{ t('workload.detail.cannotFindServices') }}
        </p>
        <p
          v-else
          class="caption"
        >
          {{ t('workload.detail.serviceListCaption') }}
        </p>
        <SortableTable
          v-if="serviceSchema && matchingServices.length > 0"
          :rows="matchingServices"
          :headers="serviceHeaders"
          key-field="id"
          :schema="serviceSchema"
          :show-groups="false"
          :search="false"
          :table-actions="false"
        />
      </Tab>
      <Tab
        v-if="!isJob && !isCronJob"
        name="ingresses"
        :label="t('workload.detail.ingresses')"
        :weight="2"
      >
        <p
          v-if="!serviceSchema"
          class="caption"
        >
          {{ t('workload.detail.cannotViewIngressesBecauseCannotViewServices') }}
        </p>
        <p
          v-else-if="!ingressSchema"
          class="caption"
        >
          {{ t('workload.detail.cannotViewIngresses') }}
        </p>
        <p
          v-else-if="matchingIngresses.length === 0"
          class="caption"
        >
          {{ t('workload.detail.cannotFindIngresses') }}
        </p>
        <p
          v-else
          class="caption"
        >
          {{ t('workload.detail.ingressListCaption') }}
        </p>
        <SortableTable
          v-if="ingressSchema && matchingIngresses.length > 0"
          :rows="matchingIngresses"
          :headers="ingressHeaders"
          key-field="id"
          :schema="ingressSchema"
          :show-groups="false"
          :search="false"
          :table-actions="false"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang='scss' scoped>
.right-align {
  float: right;
}
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
.caption {
  margin-bottom: .5em;
}
</style>
