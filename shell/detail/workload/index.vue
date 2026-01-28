<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { NAMESPACE as NAMESPACE_COL } from '@shell/config/table-headers';
import {
  POD, WORKLOAD_TYPES, SERVICE, INGRESS, NODE, NAMESPACE, WORKLOAD_TYPE_TO_KIND_MAPPING, METRICS_SUPPORTED_KINDS
} from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import Tab from '@shell/components/Tabbed/Tab';
import Loading from '@shell/components/Loading';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import { allHash } from '@shell/utils/promise';
import DashboardMetrics from '@shell/components/DashboardMetrics';
import { mapGetters } from 'vuex';
import { allDashboardsExist } from '@shell/utils/grafana';
import { PROJECT } from '@shell/config/labels-annotations';

const WORKLOAD_METRICS_DETAIL_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-workload-pods-1/rancher-workload-pods?orgId=1';
const WORKLOAD_METRICS_SUMMARY_URL = '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/rancher-workload-1/rancher-workload?orgId=1';

export default {
  components: {
    DashboardMetrics,
    Tab,
    Loading,
    ResourceTabs,
    ResourceTable,
  },

  mixins: [CreateEditView],

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
      allIngresses: this.$store.dispatch('cluster/findAll', { type: INGRESS }),
      // Nodes should be fetched because they may be referenced in the target
      // column of a service list item.
      allNodes:     hasNodes ? this.$store.dispatch('cluster/findAll', { type: NODE }) : []
    };

    if (this.podSchema) {
      hash.pods = this.value.fetchPods();
    }

    if (this.value.type === WORKLOAD_TYPES.CRON_JOB) {
      hash.jobs = this.value.matchingJobs();
    }
    const res = await allHash(hash);

    for ( const k in res ) {
      this[k] = res[k];
    }

    const isMetricsSupportedKind = METRICS_SUPPORTED_KINDS.includes(this.value.type);

    this.showMetrics = isMetricsSupportedKind && await allDashboardsExist(this.$store, this.currentCluster.id, [WORKLOAD_METRICS_DETAIL_URL, WORKLOAD_METRICS_SUMMARY_URL]);
    if (!this.showMetrics) {
      const namespace = await this.$store.dispatch('cluster/find', { type: NAMESPACE, id: this.value.metadata.namespace });

      const projectId = namespace?.metadata?.labels[PROJECT];

      if (projectId) {
        this.WORKLOAD_PROJECT_METRICS_DETAIL_URL = `/api/v1/namespaces/cattle-project-${ projectId }-monitoring/services/http:cattle-project-${ projectId }-monitoring-grafana:80/proxy/d/rancher-pod-containers-1/rancher-workload-pods?orgId=1'`;
        this.WORKLOAD_PROJECT_METRICS_SUMMARY_URL = `/api/v1/namespaces/cattle-project-${ projectId }-monitoring/services/http:cattle-project-${ projectId }-monitoring-grafana:80/proxy/d/rancher-pod-1/rancher-workload?orgId=1`;

        this.showProjectMetrics = await allDashboardsExist(this.$store, this.currentCluster.id, [this.WORKLOAD_PROJECT_METRICS_DETAIL_URL, this.WORKLOAD_PROJECT_METRICS_SUMMARY_URL], 'cluster', projectId);
      }
    }
    this.findMatchingIngresses();
  },

  async unmounted() {
    if (this.podSchema) {
      await this.value.unWatchPods();
    }
  },

  data() {
    return {
      allIngresses:                    [],
      matchingIngresses:               [],
      allNodes:                        [],
      WORKLOAD_METRICS_DETAIL_URL,
      WORKLOAD_METRICS_SUMMARY_URL,
      POD_PROJECT_METRICS_DETAIL_URL:  '',
      POD_PROJECT_METRICS_SUMMARY_URL: '',
      showMetrics:                     false,
      showProjectMetrics:              false,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    isScalable() {
      return this.value?.canUpdate;
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
      return this.$store.getters['type-map/headersFor'](this.jobSchema).filter((h) => !h.name || h.name !== NAMESPACE_COL.name);
    },

    ingressHeaders() {
      return this.$store.getters['type-map/headersFor'](this.ingressSchema).filter((h) => !h.name || h.name !== NAMESPACE_COL.name);
    },

    serviceHeaders() {
      return this.$store.getters['type-map/headersFor'](this.serviceSchema).filter((h) => !h.name || h.name !== NAMESPACE_COL.name);
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

    podHeaders() {
      return this.$store.getters['type-map/headersFor'](this.podSchema).filter((h) => !h.name || h.name !== NAMESPACE_COL.name);
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
      const podGauges = Object.values(this.podGauges);
      const total = this.value.pods.length;

      return !podGauges.find((pg) => pg.count === total);
    },

    podGauges() {
      return this.value.calcPodGauges(this.value.pods);
    },

    showJobGaugeCircles() {
      const jobGauges = Object.values(this.value.jobGauges);
      const total = this.isCronJob ? this.totalRuns : this.value.pods.length;

      return !jobGauges.find((jg) => jg.count === total);
    }
  },

  methods: {
    findMatchingIngresses() {
      if (!this.ingressSchema) {
        return [];
      }

      // Find Ingresses that forward traffic to Services
      // that select this workload.
      const matchingIngresses = this.allIngresses.filter((ingress) => {
        try {
          const rules = ingress.spec.rules;

          if (!rules || !Array.isArray(rules)) return false;

          for (let i = 0; i < rules.length; i++) {
            const paths = rules[i]?.http?.paths;

            if (!paths || !Array.isArray(paths)) continue;
            // For each Ingress, check if any Services that match
            // this workload are also target backends for the Ingress.
            for (let j = 0; j < paths.length; j++) {
              const pathData = paths[j];
              const targetServiceName = pathData?.backend?.service?.name;

              if (!targetServiceName) continue;

              for (let k = 0; k < this.value.relatedServices.length; k++) {
                const service = this.value.relatedServices[k];
                const matchingServiceName = service?.metadata?.name;

                if (ingress.metadata?.namespace === this.value.metadata?.namespace && matchingServiceName === targetServiceName) {
                  return true;
                }
              }
            }
          }
        } catch (err) {
          return false;
        }
      });

      this.matchingIngresses = matchingIngresses;
    }
  },

  watch: {
    async 'value.jobRelationships.length'(neu, old) {
      // If there are MORE jobs ensure we go out and fetch them (changes and removals are tracked by watches)
      if (neu > old) {
        // We don't need to worry about spam, this won't be called often and it will be infrequent
        await this.value.matchingJobs();
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <ResourceTabs
      :value="value"
    >
      <Tab
        v-if="isCronJob"
        name="jobs"
        :label="t('tableHeaders.jobs')"
        :weight="4"
      >
        <ResourceTable
          :rows="value.jobs"
          :headers="jobHeaders"
          key-field="id"
          :schema="jobSchema"
          :namespaced="false"
          :groupable="false"
          :search="false"
        />
      </Tab>
      <Tab
        v-else-if="value.podMatchExpression"
        name="pods"
        :label="t('tableHeaders.pods')"
        :weight="4"
      >
        <ResourceTable
          :rows="value.pods"
          :headers="podHeaders"
          key-field="id"
          :schema="podSchema"
          :namespaced="false"
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
            graph-height="600px"
          />
        </template>
      </Tab>
      <Tab
        v-if="showProjectMetrics"
        :label="t('workload.container.titles.metrics')"
        name="workload-metrics"
        :weight="3"
      >
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="WORKLOAD_PROJECT_METRICS_DETAIL_URL"
            :summary-url="WORKLOAD_PROJECT_METRICS_SUMMARY_URL"
            :vars="graphVars"
            graph-height="600px"
          />
        </template>
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
          v-else-if="value.relatedServices.length === 0"
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
        <ResourceTable
          v-if="serviceSchema && value.relatedServices.length > 0"
          :rows="value.relatedServices"
          :headers="serviceHeaders"
          key-field="id"
          :schema="serviceSchema"
          :namespaced="false"
          :groupable="false"
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
        <ResourceTable
          v-if="ingressSchema && matchingIngresses.length > 0"
          :rows="matchingIngresses"
          :headers="ingressHeaders"
          key-field="id"
          :schema="ingressSchema"
          :namespaced="false"
          :groupable="false"
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
