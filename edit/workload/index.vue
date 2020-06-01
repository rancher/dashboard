<script>
import cronstrue from 'cronstrue';
import { CONFIG_MAP, SECRET, WORKLOAD_TYPES, NODE } from '@/config/types';
import Tab from '@/components/Tabbed/Tab';
import CreateEditView from '@/mixins/create-edit-view';
import { allHash } from '@/utils/promise';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledSelect from '@/components/form/LabeledSelect';
import LabeledInput from '@/components/form/LabeledInput';
import Scheduling from '@/edit/workload/Scheduling';
import Upgrading from '@/edit/workload/Upgrading';
import Networking from '@/edit/workload/Networking';
import Footer from '@/components/form/Footer';
import Job from '@/edit/workload/Job';
import { defaultAsyncData } from '@/components/ResourceDetail';
import { _EDIT } from '@/config/query-params';
import ResourceTabs from '@/components/form/ResourceTabs';
import Container from '@/components/form/Container';

const workloadTypeOptions = [
  { value: WORKLOAD_TYPES.DEPLOYMENT, label: 'Deployment' },
  { value: WORKLOAD_TYPES.DAEMON_SET, label: 'Daemon Set' },
  { value: WORKLOAD_TYPES.STATEFUL_SET, label: 'Stateful Set' },
  { value: WORKLOAD_TYPES.REPLICA_SET, label: 'Replica Set' },
  { value: WORKLOAD_TYPES.JOB, label: 'Job' },
  { value: WORKLOAD_TYPES.CRON_JOB, label: 'Cron Job' },
  { value: WORKLOAD_TYPES.REPLICATION_CONTROLLER, label: 'Replication Controller' }

];

export default {
  name:       'CruWorkload',
  components: {
    NameNsDescription,
    LabeledSelect,
    LabeledInput,
    Tab,
    Scheduling,
    Upgrading,
    Networking,
    Footer,
    Job,
    ResourceTabs,
    Container
  },

  mixins: [CreateEditView],

  props:  {
    value: {
      type:     Object,
      required: true,
    },

    mode:     {
      type:    String,
      default: 'create'
    }
  },

  async fetch() {
    const hash = await allHash({
      configMaps: this.$store.dispatch('cluster/findAll', { type: CONFIG_MAP }),
      secrets:    this.$store.dispatch('cluster/findAll', { type: SECRET }),
      nodes:      this.$store.dispatch('cluster/findAll', { type: NODE })
    });

    this.allSecrets = hash.secrets;
    this.allConfigMaps = hash.configMaps;
    this.allNodes = hash.nodes.map(node => node.id);
  },

  asyncData(ctx) {
    let resource;

    if ( !ctx.params.id ) {
      resource = WORKLOAD_TYPES.DEPLOYMENT;
    }

    return defaultAsyncData(ctx, resource);
  },

  data() {
    let type = this.value._type || this.value.type || WORKLOAD_TYPES.DEPLOYMENT;

    if (type === 'workload') {
      type = WORKLOAD_TYPES.DEPLOYMENT;
    }

    let spec = this.value.spec;

    if ( !spec ) {
      spec = { replicas: 1 };
      this.value.spec = spec;
    }

    if (!spec.template) {
      spec.template = { spec: { restartPolicy: this.isJob ? 'Never' : 'Always' } };
    }

    return {
      spec,
      type,
      workloadTypeOptions,
      allConfigMaps:          [],
      allSecrets:             [],
      allNodes:               null,
      showTabs:               false,
    };
  },

  computed: {

    isEdit() {
      return this.mode === _EDIT;
    },

    isJob() {
      return this.type === WORKLOAD_TYPES.JOB || this.isCronJob;
    },

    isCronJob() {
      return this.type === WORKLOAD_TYPES.CRON_JOB;
    },

    isReplicable() {
      return (this.type === WORKLOAD_TYPES.DEPLOYMENT || this.type === WORKLOAD_TYPES.REPLICA_SET || this.type === WORKLOAD_TYPES.REPLICATION_CONTROLLER || this.type === WORKLOAD_TYPES.STATEFUL_SET);
    },

    // if this is a cronjob, grab pod spec from within job template spec
    podTemplateSpec: {
      get() {
        return this.isCronJob ? this.spec.jobTemplate.spec.template.spec : this.spec.template.spec;
      },
      set(neu) {
        if (this.isJob) {
          this.$set(this.spec.jobTemplate.spec.template, 'spec', neu);
        } else {
          this.$set(this.spec.template, 'spec', neu);
        }
      }
    },

    containers: {
      get() {
        if (!this.podTemplateSpec.containers) {
          this.$set(this.podTemplateSpec, 'containers', [{ }]);
        }
        // add a key for list rendering porpoises
        this.podTemplateSpec.containers.forEach((container) => {
          if (!container._key) {
            container._key = Math.random();
          }
        });

        return this.podTemplateSpec.containers
        ;
      },

      set(neu) {
        this.$set(this.podTemplateSpec, 'containers', neu);
      }
    },

    schema() {
      return this.$store.getters['cluster/schemaFor']( this.type );
    },

    // show cron schedule in human-readable format
    cronLabel() {
      const { schedule } = this.spec;

      if (!this.isCronJob || !schedule) {
        return null;
      }

      try {
        const hint = cronstrue.toString(schedule);

        return hint;
      } catch (e) {
        return 'invalid cron expression';
      }
    },

    workloadSelector() {
      return { 'workload.user.cattle.io/workloadselector': `${ 'deployment' }-${ this.value.metadata.namespace }-${ this.value.metadata.name }` };
    },

    namespacedSecrets() {
      const namespace = this.value?.metadata?.namespace;

      if (namespace) {
        return this.allSecrets.filter(secret => secret.metadata.namespace === namespace);
      } else {
        return this.allSecrets;
      }
    },

    namespacedConfigMaps() {
      const namespace = this.value?.metadata?.namespace;

      if (namespace) {
        return this.allConfigMaps.filter(configMap => configMap.metadata.namespace === namespace);
      } else {
        return this.allConfigMaps;
      }
    },

  },

  watch: {
    type(neu, old) {
      const template = old === WORKLOAD_TYPES.CRON_JOB ? this.spec?.jobTemplate?.spec?.template : this.spec?.template;

      if (!template.spec) {
        template.spec = {};
      }
      const restartPolicy = this.isJob ? 'Never' : 'Always';

      this.$set(template.spec, 'restartPolicy', restartPolicy);

      if (!this.isReplicable) {
        delete this.spec.replicas;
      }

      if (old === WORKLOAD_TYPES.CRON_JOB) {
        this.$set(this.spec, 'template', { ...template });
        delete this.spec.jobTemplate;
        delete this.spec.schedule;
      } else if (neu === WORKLOAD_TYPES.CRON_JOB) {
        this.$set(this.spec, 'jobTemplate', { spec: { template } });
        this.$set(this.spec, 'schedule', '0 * * * *');
        delete this.spec.template;
      }

      this.$set(this.value, 'type', neu);
      delete this.value.apiVersion;
    },
  },

  methods: {
    toggleTabs() {
      this.showTabs = !this.showTabs;
    },

    saveWorkload(cb) {
      if (!this.spec.selector && this.type !== WORKLOAD_TYPES.JOB) {
        this.spec.selector = { matchLabels: this.workloadSelector };
      }

      let template;

      if (this.type === WORKLOAD_TYPES.CRON_JOB) {
        template = this.spec.jobTemplate;
      } else {
        template = this.spec.template;
      }

      if (!template.metadata && this.type !== WORKLOAD_TYPES.JOB) {
        template.metadata = { labels: this.workloadSelector };
      }
      delete this.value.kind;
      this.save(cb);
    },
  },
};
</script>

<template>
  <form>
    <slot :value="value" name="top">
      <NameNsDescription :value="value" :mode="mode" :extra-columns="['type']">
        <template v-slot:type>
          <LabeledSelect v-model="type" label="Type" :disabled="isEdit" :options="workloadTypeOptions" />
        </template>
      </NameNsDescription>

      <div class="row">
        <div class="col span-4" />
        <template v-if="isCronJob">
          <div class="col span-4">
            <LabeledInput v-model="spec.schedule" label="cron Schedule" />
            <span class="cron-hint text-small">{{ cronLabel }}</span>
          </div>
        </template>
        <template v-if="isReplicable">
          <div class="col span-4">
            <LabeledInput v-model.number="spec.replicas" label="Replicas" />
          </div>
        </template>
      </div>
    </slot>

    <ResourceTabs v-model="value" :mode="mode">
      <template #before>
        <Tab v-if="isJob" label="Job Configuration" name="job">
          <Job v-model="spec" :mode="mode" :type="type" />
        </Tab>
        <Tab label="Containers" name="containers">
          <div class="containers-container">
            <div v-for="(container, i) in containers" :key="container._key">
              <div class="row">
                <h2 class="mb-10 col span-11">
                  Container
                </h2>
                <button v-if="mode!=='view'" class="btn role-link" @click="e=>containers.splice(i, 1)">
                  remove
                </button>
              </div>
              <Container
                :ref="`container-${i}`"
                :value="container"
                :mode="mode"
                :config-maps="namespacedConfigMaps"
                :secrets="namespacedSecrets"
                @input="e=>containers[i]=e"
              />
              <hr v-if="i<containers.length-1" class="mb-20 mt-20">
            </div>
            <button v-if="mode!=='view'" class="btn role-primary mt-20" @click="e=>containers.push({ _key: Math.random() })">
              Add Container
            </button>
          </div>
        </Tab>
        <Tab label="Networking" name="networking">
          <Networking v-model="podTemplateSpec" :mode="mode" />
        </Tab>
        <Tab label="Node Scheduling" name="scheduling">
          <Scheduling v-model="podTemplateSpec" :mode="mode" />
        </Tab>
        <Tab label="Scaling/Upgrade Policy" name="upgrading">
          <Upgrading v-model="spec" :mode="mode" />
        </Tab>
      </template>
    </ResourceTabs>

    <Footer v-if="mode!= 'view'" :errors="errors" :mode="mode" @save="saveWorkload" @done="done" />
  </form>
</template>

<style>
  .cron-hint{
    color: var(--muted);
    padding: 3px;
  }
</style>
