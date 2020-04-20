<script>
import cronstrue from 'cronstrue';
import { CONFIG_MAP, SECRET, WORKLOAD_TYPES, NODE } from '@/config/types';
import LoadDeps from '@/mixins/load-deps';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import CreateEditView from '@/mixins/create-edit-view';
import { allHash } from '@/utils/promise';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledSelect from '@/components/form/LabeledSelect';
import LabeledInput from '@/components/form/LabeledInput';
import HealthCheck from '@/components/form/HealthCheck';
import Command from '@/edit/workload/Command';
import Security from '@/edit/workload/Security';
import Scheduling from '@/edit/workload/Scheduling';
import Upgrading from '@/edit/workload/Upgrading';
import Networking from '@/edit/workload/Networking';
import Footer from '@/components/form/Footer';
import Job from '@/edit/workload/Job';
import Labels from '@/components/form/Labels';
import WorkloadPorts from '@/edit/workload/WorkloadPorts';
import { defaultAsyncData } from '@/components/ResourceDetail.vue';
import { _EDIT } from '@/config/query-params';

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
    Tabbed,
    Tab,
    HealthCheck,
    Command,
    Security,
    Scheduling,
    Upgrading,
    Labels,
    Networking,
    Footer,
    Job,
    WorkloadPorts,
  },

  mixins:     [CreateEditView, LoadDeps],

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
      allConfigMaps:          null,
      allSecrets:             null,
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

    container: {
      get() {
        const { containers } = this.podTemplateSpec;

        if (!containers) {
          this.$set(this.podTemplateSpec, 'containers', [{ name: this.value.metadata.name }]);
        }

        // TODO account for multiple containers (sidecar)
        return this.podTemplateSpec.containers[0];
      },

      set(neu) {
        this.$set(this.podTemplateSpec.containers, 0, { ...neu, name: this.value.metadata.name });
      }
    },

    containerImage: {
      get() {
        return this.container.image;
      },
      set(neu) {
        this.container = { ...this.container, image: neu };
      }
    },

    containerPorts: {
      get() {
        return this.container.ports || [];
      },
      set(neu) {
        this.container = { ...this.container, ports: neu };
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
    }
  },

  asyncData(ctx) {
    let resource;

    if ( !ctx.params.id ) {
      resource = WORKLOAD_TYPES.DEPLOYMENT;
    }

    return defaultAsyncData(ctx, resource);
  },

  methods: {
    async loadDeps() {
      const hash = await allHash({
        configMaps: this.$store.dispatch('cluster/findAll', { type: CONFIG_MAP }),
        secrets:    this.$store.dispatch('cluster/findAll', { type: SECRET }),
        nodes:      this.$store.dispatch('cluster/findAll', { type: NODE })
      });

      this.allSecrets = hash.secrets;
      this.allConfigMaps = hash.configMaps;
      this.allNodes = hash.nodes.map(node => node.id);
    },

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
      <NameNsDescription v-model="value.metadata" :mode="mode" :extra-columns="['type']" :description.sync="description">
        <template v-slot:type>
          <LabeledSelect v-model="type" label="Type" :disabled="isEdit" :options="workloadTypeOptions" />
        </template>
      </NameNsDescription>

      <div class="row">
        <div class="col span-4">
          <LabeledInput v-model="containerImage" label="Container Image" placeholder="eg nginx:latest" required />
        </div>
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

      <div class="row">
        <WorkloadPorts v-model="containerPorts" :mode="mode" />
      </div>
    </slot>
    <Tabbed :default-tab="isJob ? 'job' : 'command'">
      <Tab v-if="isJob" label="Job Configuration" name="job">
        <Job v-model="spec" :mode="mode" :type="type" />
      </Tab>
      <Tab label="Command" name="command">
        <Command
          v-if="allConfigMaps"
          v-model="container"
          :spec="container"
          :secrets="allSecrets"
          :config-maps="allConfigMaps"
          :mode="mode"
          :namespace="value.metadata.namespace"
        />
      </Tab>
      <Tab label="Networking" name="networking">
        <Networking v-model="podTemplateSpec" :mode="mode" />
      </Tab>
      <Tab label="Health" name="health">
        <HealthCheck :spec="container" :mode="mode" />
      </Tab>
      <Tab label="Security" name="security">
        <Security v-model="podTemplateSpec" :mode="mode" />
      </Tab>

      <Tab label="Node Scheduling" name="scheduling">
        <Scheduling v-model="podTemplateSpec" :mode="mode" />
      </Tab>
      <Tab label="Scaling/Upgrade Policy" name="upgrading">
        <Upgrading v-model="spec" :mode="mode" />
      </Tab>

      <Tab label="Labels" name="labelsAndAnnotations">
        <Labels :spec="value" :mode="mode" />
      </Tab>
    </Tabbed>
    <Footer v-if="mode!= 'view'" :errors="errors" :mode="mode" @save="saveWorkload" @done="done" />
  </form>
</template>

<style>
  .cron-hint{
    color: var(--muted);
    padding: 3px;
  }
</style>
