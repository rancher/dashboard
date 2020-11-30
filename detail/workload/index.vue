<script>
import createEditView from '@/mixins/create-edit-view';
import { STATE, NAME, NODE, POD_IMAGES } from '@/config/table-headers';
import { POD, WORKLOAD_TYPES, SECRET } from '@/config/types';
import ResourceTable from '@/components/ResourceTable';
import Tab from '@/components/Tabbed/Tab';
import Loading from '@/components/Loading';
import ResourceTabs from '@/components/form/ResourceTabs';
import CountGauge from '@/components/CountGauge';
import { mapGetters } from 'vuex';
import { allHash } from '@/utils/promise';

export default {
  components: {
    ResourceTable,
    Tab,
    Loading,
    ResourceTabs,
    CountGauge
  },

  mixins: [createEditView],

  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: 'view'
    }
  },

  async fetch() {
    let jobs = [];

    if (this.value.type === WORKLOAD_TYPES.CRON_JOB) {
      jobs = this.value?.status?.active;
    }

    const hash = await allHash({
      pods:    this.value.pods(),
      secrets: this.$store.dispatch('cluster/findAll', { type: SECRET }),
      jobs:     Promise.all(jobs.map(each => this.$store.dispatch('cluster/find', { type: WORKLOAD_TYPES.JOB, id: `${ each.namespace }/${ each.name }` })))
    });

    this.pods = hash.pods;
    this.secrets = hash.secrets;
    this.jobs = hash.jobs;
  },

  data() {
    const isCronJob = this.value.type === WORKLOAD_TYPES.CRON_JOB;

    const podTemplateSpec = isCronJob ? this.value.spec.jobTemplate.spec.template.spec : this.value.spec?.template?.spec;

    const container = podTemplateSpec.containers[0];

    const name = this.value?.metadata?.name || this.value.id;

    const podSchema = this.$store.getters['cluster/schemaFor'](POD);
    const jobSchema = this.$store.getters['cluster/schemaFor'](WORKLOAD_TYPES.JOB);
    const jobHeaders = this.$store.getters['type-map/headersFor'](jobSchema);

    return {
      type:           this.value.type,
      podSchema,
      jobSchema,
      jobHeaders,
      name,
      pods:           null,
      secrets: [],
      container,
      podTemplateSpec,
      jobs:    []
    };
  },

  computed:   {
    jobGauges() {
      const out = {
        succeeded: { color: 'success', count: 0 }, running: { color: 'info', count: 0 }, failed: { color: 'error', count: 0 }
      };

      if (this.type === WORKLOAD_TYPES.CRON_JOB) {
        this.jobs.forEach((job) => {
          const { status = {} } = job;

          out.running.count += status.active || 0;
          out.succeeded.count += status.succeeded || 0;
          out.failed.count += status.failed || 0;
        });
      } else if (this.type === WORKLOAD_TYPES.JOB) {
        const { status = {} } = this.value;

        out.running.count = status.active || 0;
        out.succeeded.count = status.succeeded || 0;
        out.failed.count = status.failed || 0;
      } else {
        return null;
      }

      return out;
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
      return this.pods ? [
        STATE,
        NAME,
        NODE,
        POD_IMAGES
      ] : null;
    },

    isJob() {
      return this.type === WORKLOAD_TYPES.JOB;
    },

    isCronJob() {
      return this.type === WORKLOAD_TYPES.CRON_JOB;
    },

    isStatefulSet() {
      return this.type === WORKLOAD_TYPES.STATEFUL_SET;
    },

    namespacedSecrets() {
      const namespace = this.value?.metadata?.namespace;

      if (namespace) {
        return this.secrets.filter(
          secret => secret.metadata.namespace === namespace
        );
      } else {
        return this.secrets;
      }
    },

    ...mapGetters({ t: 'i18n/t' })
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h3 class="mt-20">
      {{ isJob || isCronJob ? t('workload.detailTop.runs') :t('workload.detailTop.pods') }}
    </h3>
    <div v-if="pods" class="gauges mb-20">
      <template v-if="jobGauges">
        <CountGauge
          v-for="(group, key) in jobGauges"
          :key="key"
          :total="isCronJob? jobs.length : pods.length"
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
    <ResourceTabs>
      <Tab v-if="jobs && jobs.length" name="jobs" :label="t('tableHeaders.jobs')">
        <ResourceTable
          :rows="jobs"
          :headers="jobHeaders"
          key-field="id"
          :schema="jobSchema"
          :show-groups="false"
          :search="false"
        />
      </Tab>
      <Tab v-else name="pods" :label="t('tableHeaders.pods')">
        <ResourceTable
          v-if="pods"
          :rows="pods"
          :headers="podHeaders"
          key-field="id"
          :table-actions="false"
          :schema="podSchema"
          :show-groups="false"
          :search="false"
        />
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
