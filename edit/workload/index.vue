<script>
import omitBy from 'lodash/omitBy';
import { cleanUp } from '@/utils/object';
import cronstrue from 'cronstrue';
import {
  CONFIG_MAP, SECRET, WORKLOAD_TYPES, NODE, SERVICE
} from '@/config/types';
import Tab from '@/components/Tabbed/Tab';
import CreateEditView from '@/mixins/create-edit-view';
import { allHash } from '@/utils/promise';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledSelect from '@/components/form/LabeledSelect';
import LabeledInput from '@/components/form/LabeledInput';
import HealthCheck from '@/components/form/HealthCheck';
import EnvVars from '@/components/form/EnvVars';
import Security from '@/components/form/Security';
import Upgrading from '@/edit/workload/Upgrading';
import Networking from '@/components/form/Networking';
import Job from '@/edit/workload/Job';
import { defaultAsyncData } from '@/components/ResourceDetail';
import { _EDIT, _CREATE } from '@/config/query-params';
import WorkloadPorts from '@/components/form/WorkloadPorts';
import ContainerResourceLimit from '@/components/ContainerResourceLimit';
import Wizard from '@/components/Wizard';
import KeyValue from '@/components/form/KeyValue';
import Tabbed from '@/components/Tabbed';
import { mapGetters } from 'vuex';
import ButtonDropdown from '@/components/ButtonDropdown';
import ShellInput from '@/components/form/ShellInput';
import Checkbox from '@/components/form/Checkbox';
import NodeScheduling from '@/components/form/NodeScheduling';
import PodScheduling from '@/components/form/PodScheduling';
import Tolerations from '@/components/form/Tolerations';

export default {
  name:       'CruWorkload',
  components: {
    Wizard,
    NameNsDescription,
    LabeledSelect,
    LabeledInput,
    ShellInput,
    Checkbox,
    KeyValue,
    Tabbed,
    Tab,
    Upgrading,
    Networking,
    Job,
    HealthCheck,
    EnvVars,
    Security,
    WorkloadPorts,
    ContainerResourceLimit,
    ButtonDropdown,
    PodScheduling,
    NodeScheduling,
    Tolerations
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true
    },

    mode: {
      type:    String,
      default: 'create'
    }
  },

  async fetch() {
    const hash = await allHash({
      configMaps: this.$store.dispatch('cluster/findAll', { type: CONFIG_MAP }),
      secrets:    this.$store.dispatch('cluster/findAll', { type: SECRET }),
      nodes:      this.$store.dispatch('cluster/findAll', { type: NODE }),
      services:   this.$store.dispatch('cluster/findAll', { type: SERVICE })
    });

    this.allSecrets = hash.secrets;
    this.allConfigMaps = hash.configMaps;
    this.allNodes = hash.nodes.map(node => node.id);
    this.headlessServices = hash.services.filter(service => service.spec.clusterIP === 'None');
  },

  asyncData(ctx) {
    let resource;

    if ( ctx.params.resource === 'workload') {
      resource = WORKLOAD_TYPES.DEPLOYMENT;
    }

    return defaultAsyncData(ctx, resource);
  },

  data() {
    const t = this.$store.getters['i18n/t'];
    let type = this.value._type || this.value.type;

    if (type === 'workload') {
      type = WORKLOAD_TYPES.DEPLOYMENT;
    }
    // track spec separately from resource instance so it can be trashed when the wizard is cancelled
    const spec = { ...this.value.spec };

    if (!spec.replicas) {
      spec.replicas = 1;
    }

    if (!spec.template) {
      spec.template = { spec: { restartPolicy: this.isJob ? 'Never' : 'Always' } };
    }

    const steps = [
      {
        name:    'type',
        label:   t('workload.wizard.titles.selectType.title'),
        subtext: 'workload.wizard.titles.selectType.subtitle',
        ready:   !!type,
      },
      {
        name:    'container',
        label:   t('workload.wizard.titles.defineContainer.title'),
        subtext: 'workload.wizard.titles.defineContainer.subtitle',
        ready:   false
      },
      {
        name:    'storage',
        label:   t('workload.wizard.titles.storage.title'),
        subtext: 'workload.wizard.titles.storage.subtitle',
        ready:   true
      },
      {
        name:    'advanced',
        label:   t('workload.wizard.titles.advanced.title'),
        subtext: 'workload.wizard.titles.advanced.subtitle',
        ready:   true
      }
    ];

    return {
      showBannerTitle:  this.mode !== _CREATE,
      steps,
      spec,
      type,
      allConfigMaps:    [],
      allSecrets:       [],
      headlessServices: [],
      allNodes:         null,
      showTabs:         false,
    };
  },

  computed: {
    // start wizard at step 2 if type selection isn't relevant  (navigating from type-specific page, or editing/cloning)
    initStepIndex() {
      if (this.doneParams?.resource !== 'workload' || this.mode !== _CREATE) {
        return 1;
      } else {
        return 0;
      }
    },

    currentStepIndex() {
      return this.$route.query?.step;
    },

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
      return (
        this.type === WORKLOAD_TYPES.DEPLOYMENT ||
        this.type === WORKLOAD_TYPES.REPLICA_SET ||
        this.type === WORKLOAD_TYPES.REPLICATION_CONTROLLER ||
        this.type === WORKLOAD_TYPES.STATEFUL_SET
      );
    },

    isStatefulSet() {
      return this.type === WORKLOAD_TYPES.STATEFUL_SET;
    },

    // TODO better validation
    containerIsReady() {
      const required = [this.container.image, this.container.imagePullPolicy];

      if (this.isReplicable) {
        required.push(this.spec.replicas);
      } else if (this.isCronJob) {
        required.push(this.spec.schedule);
      }

      return required.filter(prop => !!prop).length === required.length;
    },

    // if this is a cronjob, grab pod spec from within job template spec
    podTemplateSpec: {
      get() {
        return this.isCronJob ? this.spec.jobTemplate.spec.template.spec : this.spec?.template?.spec;
      },
      set(neu) {
        if (this.isCronJob) {
          this.$set(this.spec.jobTemplate.spec.template, 'spec', neu);
        } else {
          this.$set(this.spec.template, 'spec', neu);
        }
      }
    },

    container: {
      get() {
        if (!this.podTemplateSpec.containers) {
          this.$set(this.podTemplateSpec, 'containers', [
            { name: this.value?.metadata?.name, imagePullPolicy: 'Always' }
          ]);
        }

        return this.podTemplateSpec.containers[0];
      },

      set(neu) {
        this.$set(this.podTemplateSpec.containers, 0, neu);
      }
    },

    flatResources: {
      get() {
        const { limits = {}, requests = {} } = this.container.resources || {};
        const { cpu:limitsCpu, memory:limitsMemory } = limits;
        const { cpu:requestsCpu, memory:requestsMemory } = requests;

        return {
          limitsCpu, limitsMemory, requestsCpu, requestsMemory
        };
      },
      set(neu) {
        const {
          limitsCpu, limitsMemory, requestsCpu, requestsMemory
        } = neu;

        const out = {
          requests: {
            cpu:    requestsCpu,
            memory: requestsMemory
          },
          limits: {
            cpu:    limitsCpu,
            memory: limitsMemory
          }
        };

        this.$set(this.container, 'resources', cleanUp(out));
      }
    },

    healthCheck: {
      get() {
        const { readinessProbe, livenessProbe, startupProbe } = this.container;

        return {
          readinessProbe, livenessProbe, startupProbe
        };
      },
      set(neu) {
        Object.assign(this.container, neu);
      }
    },

    stdinSelect: {
      get() {
        if (this.container.stdin) {
          if (this.container.stdinOnce) {
            return 'Once';
          }

          return 'Yes';
        }
        if (this.container.stdinOnce) {
          return null;
        }

        return 'No';
      },
      set(neu) {
        switch (neu) {
        case 'Yes':
          this.container.stdin = true;
          this.container.stdinOnce = false;
          break;
        case 'Once':
          this.container.stdin = true;
          this.container.stdinOnce = true;
          break;
        case 'No':
          this.container.stdin = false;
          this.container.stdinOnce = false;
          break;
        default:
          this.container.stdin = false;
          this.container.stdinOnce = true;
        }
      }
    },

    schema() {
      return this.$store.getters['cluster/schemaFor'](this.type);
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
      return {
        'workload.user.cattle.io/workloadselector': `${ 'deployment' }-${
          this.value.metadata.namespace
        }-${ this.value.metadata.name }`
      };
    },

    namespacedSecrets() {
      const namespace = this.value?.metadata?.namespace;

      if (namespace) {
        return this.allSecrets.filter(
          secret => secret.metadata.namespace === namespace
        );
      } else {
        return this.allSecrets;
      }
    },

    namespacedConfigMaps() {
      const namespace = this.value?.metadata?.namespace;

      if (namespace) {
        return this.allConfigMaps.filter(
          configMap => configMap.metadata.namespace === namespace
        );
      } else {
        return this.allConfigMaps;
      }
    },

    workloadTypes() {
      return omitBy(WORKLOAD_TYPES, (type) => {
        return type === WORKLOAD_TYPES.REPLICA_SET || type === WORKLOAD_TYPES.REPLICATION_CONTROLLER;
      } );
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  watch: {
    type(neu, old) {
      const template =
        old === WORKLOAD_TYPES.CRON_JOB ? this.spec?.jobTemplate?.spec?.template : this.spec?.template;

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

    containerIsReady(neu) {
      this.steps[1].ready = neu;
    },

  },

  created() {
    if (this.containerIsReady) {
      this.steps[1].ready = true;
    }
  },

  methods: {
    nameDisplayFor(type) {
      const schema = this.$store.getters['cluster/schemaFor'](type);

      return this.$store.getters['type-map/labelFor'](schema) || '';
    },

    // TODO better images for workload types?
    // show initials of workload type in blue circles for now
    initialDisplayFor(type) {
      const typeDisplay = this.nameDisplayFor(type);
      const eachWord = typeDisplay.split(' ');

      return eachWord.reduce((total, word) => {
        total += word[0];

        return total;
      }, '');
    },

    cancel() {
      this.done();
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

      // matchExpressions 'values' are formatted incorrectly; fix them before sending to API
      const nodeAffinity = template?.spec?.affinity?.nodeAffinity || {};
      const preferredDuringSchedulingIgnoredDuringExecution =
        nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution || [];
      const requiredDuringSchedulingIgnoredDuringExecution =
        nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution || {};

      preferredDuringSchedulingIgnoredDuringExecution.forEach((term) => {
        const matchExpressions = term?.preference?.matchExpressions || [];

        matchExpressions.forEach((expression) => {
          if (expression.values) {
            expression.values = typeof expression.values === 'string' ? [expression.values] : [...expression.values];
          }
        });
      });

      (
        requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms || []
      ).forEach((term) => {
        const matchExpressions = term.matchExpressions || [];

        matchExpressions.forEach((expression) => {
          if (expression.values) {
            expression.values = typeof expression.values === 'string' ? [expression.values] : [...expression.values];
          }
        });
      });

      delete this.value.kind;

      if (!this.container.name) {
        this.$set(this.container, 'name', this.value.metadata.name);
      }

      Object.assign(this.value, { spec: this.spec });
      this.save(cb);
    }
  }
};
</script>

<template>
  <form>
    <Wizard
      v-if="mode"
      :errors="errors"
      :finish-mode="mode"
      :init-step-index="initStepIndex"
      :steps="steps"
      :initial-title="false"
      :banner-title="nameDisplayFor(type)"
      :banner-image="initialDisplayFor(type)"
      @finish="saveWorkload"
      @cancel="cancel"
    >
      <template v-if="currentStepIndex > 1 || mode !=='create'" #bannerTitleImage>
        <span class="type-placeholder"> {{ initialDisplayFor(type) }} </span>
      </template>
      <template v-if="steps[currentStepIndex-1]" #bannerSubtext>
        <t :k="steps[currentStepIndex-1].subtext" :raw="true" />
      </template>
      <template #type>
        <div class="types-container">
          <div
            v-for="workloadType in workloadTypes"
            :key="workloadType"
            class="choice-banner"
            :class="{ selected: type === workloadType }"
            @click="type = workloadType"
          >
            <div :style="{ 'background-color': 'var(--primary)' }" class="round-image">
              <span class="type-placeholder">{{ initialDisplayFor(workloadType) }}</span>
            </div>
            <div>
              <h5>  {{ nameDisplayFor(workloadType) }}</h5>
              <t class="type-description" :k="`workload.wizard.descriptions.'${workloadType}'`" :raw="true" />
            </div>
          </div>
        </div>
      </template>
      <template #container>
        <div class="bordered-section">
          <div class="row">
            <div class="col span-12">
              <NameNsDescription :value="value" :mode="mode" />
            </div>
          </div>
          <div v-if="isCronJob || isReplicable" class="row">
            <div v-if="isCronJob" class="col span-6">
              <LabeledInput v-model="spec.schedule" :mode="mode" :label="t('workload.cronSchedule')" />
              <span class="cron-hint text-small">{{ cronLabel }}</span>
            </div>
            <div v-if="isReplicable" class="col span-6">
              <LabeledInput v-model.number="spec.replicas" required :mode="mode" :label="t('workload.replicas')" />
            </div>
            <div v-if="isStatefulSet" class="col span-6">
              <LabeledSelect
                v-model="spec.serviceName"
                option-label="metadata.name"
                :reduce="service=>service.metadata.name"
                :mode="mode"
                :label="t('workload.serviceName')"
                :options="headlessServices"
              />
            </div>
          </div>
        </div>

        <div class="bordered-section">
          <h3>{{ t('workload.container.titles.image') }}</h3>
          <div class="row mb-20">
            <div class="col span-6">
              <LabeledInput
                v-model="container.image"
                :label="t('workload.container.image')"
                placeholder="eg nginx:latest"
                required
              />
            </div>
            <div class="col span-6">
              <LabeledSelect
                v-model="container.imagePullPolicy"
                :label="t('workload.container.imagePullPolicy')"
                :options="['Always', 'IfNotPresent', 'Never']"
                :mode="mode"
              />
            </div>
          </div>
        </div>

        <div class="bordered-section">
          <h3>{{ t('workload.container.titles.ports') }}</h3>
          <div class="row">
            <WorkloadPorts v-model="container.ports" :mode="mode" />
          </div>
        </div>

        <div class="bordered-section">
          <h3>{{ t('workload.container.titles.command') }}</h3>
          <div class="row">
            <div class="col span-5">
              <slot name="entrypoint">
                <ShellInput
                  v-model="value.command"
                  :mode="mode"
                  :label="t('workload.container.command.command')"
                  placeholder="e.g. /bin/sh"
                />
              </slot>
            </div>
            <div class="col span-5">
              <slot name="command">
                <ShellInput
                  v-model="value.args"
                  :mode="mode"
                  :label="t('workload.container.command.args')"
                  placeholder="e.g. /usr/sbin/httpd -f httpd.conf"
                />
              </slot>
            </div>
            <div class="col span-2">
              <Checkbox v-model="value.tty" label="TTY" :mode="mode" />
            </div>
          </div>
        </div>

        <div class="bordered-section">
          <h3>{{ t('workload.container.titles.env') }}</h3>
          <div class="row">
            <EnvVars v-model="container" :mode="mode" :secrets="namespacedSecrets" :config-maps="namespacedConfigMaps" />
          </div>
        </div>

        <div class="bordered-section">
          <h3>{{ t('resourceDetail.detailTop.labels') }}</h3>
          <div class="row">
            <KeyValue
              key="labels"
              v-model="value.metadata.labels"
              :mode="mode"
              :pad-left="false"
              :read-allowed="false"
              :protip="false"
            />
          </div>
        </div>

        <div>
          <h3>{{ t('resourceDetail.detailTop.annotations') }}</h3>
          <div class="row">
            <KeyValue
              key="annotations"
              v-model="value.metadata.annotations"
              :mode="mode"
              :pad-left="false"
              :read-allowed="false"
              :protip="false"
            />
          </div>
        </div>
      </template>
      <template #storage>
        <t k="generic.comingSoon" />
      </template>
      <template #advanced>
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="container.workingDir"
              :mode="mode"
              :label="t('workload.container.command.workingDir')"
              placeholder="e.g. /myapp"
            />
          </div>
          <div class="col span-6">
            <LabeledSelect v-model="stdinSelect" label="Stdin" :options="container.tty ? ['Yes', 'Once'] : ['Yes', 'Once', 'No']" :mode="mode" />
          </div>
        </div>
        <Tabbed :side-tabs="true">
          <Tab :label="t('workload.container.titles.resources')" name="resources">
            <ContainerResourceLimit v-model="flatResources" class="bordered-section" :mode="mode" :show-tip="false" />
            <div class="bordered-section">
              <h3 class="mb-10">
                <t k="workload.scheduling.titles.tolerations" />
              </h3>
              <div class="row">
                <Tolerations v-model="podTemplateSpec.tolerations" :mode="mode" />
              </div>
            </div>

            <div>
              <h3 class="mb-10">
                <t k="workload.scheduling.titles.priority" />
              </h3>
              <div class="row">
                <div class="col span-6">
                  <LabeledInput v-model.number="podTemplateSpec.priority" :mode="mode" :label="t('workload.scheduling.priority.priority')" />
                </div>
                <div class="col span-6">
                  <LabeledInput v-model="podTemplateSpec.priorityClassname" :mode="mode" :label="t('workload.scheduling.priority.className')" />
                </div>
              </div>
            </div>
          </Tab>
          <Tab :label="t('workload.container.titles.podScheduling')" name="podScheduling">
            <PodScheduling :mode="mode" :value="podTemplateSpec" />
          </Tab>
          <Tab :label="t('workload.container.titles.nodeScheduling')" name="nodeScheduling">
            <NodeScheduling :mode="mode" :value="podTemplateSpec" />
          </Tab>
          <Tab label="Scaling/Upgrade Policy" name="upgrading">
            <Job v-if="isJob || isCronJob" v-model="spec" :mode="mode" :type="type" />
            <Upgrading v-else v-model="spec" :mode="mode" :type="type" />
          </Tab>
          <Tab :label="t('workload.container.titles.healthCheck')" name="healthCheck">
            <HealthCheck v-model="healthCheck" :mode="mode" />
          </Tab>
          <Tab :label="t('workload.container.titles.securityContext')" name="securityContext">
            <Security v-model="container.securityContext" :mode="mode" />
          </Tab>
          <Tab :label="t('workload.container.titles.networking')" name="networking">
            <Networking v-model="podTemplateSpec" :mode="mode" />
          </Tab>
        </tabbed>
      </template>
      <template #cancel>
        <button type="button" class="btn role-secondary" @click="cancel">
          <t k="generic.cancel" />
        </button>
      </template>
      <template #next="{next}">
        <ButtonDropdown :disabled="!(steps[currentStepIndex-1]||{}).ready" class="next-dropdown">
          <template #button-content>
            <button :disabled="!(steps[currentStepIndex-1]||{}).ready" type="button" :class="{'text-primary': !!(steps[currentStepIndex-1]||{}).ready}" class="btn bg-transparent" @click="next">
              {{ t('wizard.next') }}
            </button>
          </template>
          <template v-if="containerIsReady" #popover-content>
            <ul class="list-unstyled menu">
              <li v-close-popover.all @click="()=>saveWorkload(()=>{})">
                {{ t("generic.create") }}
              </li>
            </ul>
          </template>
        </ButtonDropdown>
      </template>
    </Wizard>
  </form>
</template>

<style lang='scss'>
.types-container {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

.type-placeholder{
  color: white;
    font-size: 2.5em;
    height: 100%;
    width: 100%;
    background-color: var(--primary);
    display: flex;
    justify-content: center;
    align-items: center;
}

.type-description{
  color: var(--input-label)
}

.bordered-section {
  border-bottom: 1px solid var(--border);
  margin-bottom: 40px;
  padding-bottom: 20px;
}

.cron-hint {
  color: var(--muted);
  padding: 3px;
}

.next-dropdown{
  display: inline-block;
}
</style>
