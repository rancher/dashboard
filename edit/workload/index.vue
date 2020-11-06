<script>
import omitBy from 'lodash/omitBy';
import { cleanUp } from '@/utils/object';
import cronstrue from 'cronstrue';
import {
  CONFIG_MAP, SECRET, WORKLOAD_TYPES, NODE, SERVICE, PVC
} from '@/config/types';
import Tab from '@/components/Tabbed/Tab';
import CreateEditView from '@/mixins/create-edit-view';
import { allHash } from '@/utils/promise';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledSelect from '@/components/form/LabeledSelect';
import LabeledInput from '@/components/form/LabeledInput';
import HealthCheck from '@/components/form/HealthCheck';
import Security from '@/components/form/Security';
import Upgrading from '@/edit/workload/Upgrading';
import Networking from '@/components/form/Networking';
import VolumeClaimTemplate from '@/edit/workload/VolumeClaimTemplate';
import Job from '@/edit/workload/Job';
import { defaultAsyncData } from '@/components/ResourceDetail';
import { _EDIT } from '@/config/query-params';
import WorkloadPorts from '@/components/form/WorkloadPorts';
import ContainerResourceLimit from '@/components/ContainerResourceLimit';
import KeyValue from '@/components/form/KeyValue';
import Tabbed from '@/components/Tabbed';
import { mapGetters } from 'vuex';
import NodeScheduling from '@/components/form/NodeScheduling';
import PodScheduling from '@/components/form/PodScheduling';
import Tolerations from '@/components/form/Tolerations';
import CruResource from '@/components/CruResource';
import Command from '@/components/form/Command';
import Storage from '@/edit/workload/storage';
import Labels from '@/components/form/Labels';

export default {
  name:       'CruWorkload',
  components: {
    NameNsDescription,
    LabeledSelect,
    LabeledInput,
    KeyValue,
    Tabbed,
    Tab,
    Upgrading,
    Networking,
    Job,
    HealthCheck,
    Security,
    WorkloadPorts,
    ContainerResourceLimit,
    PodScheduling,
    NodeScheduling,
    Tolerations,
    CruResource,
    Command,
    Storage,
    VolumeClaimTemplate,
    Labels
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
    const requests = {
      configMaps: this.$store.dispatch('cluster/findAll', { type: CONFIG_MAP }),
      nodes:      this.$store.dispatch('cluster/findAll', { type: NODE }),
      services:   this.$store.dispatch('cluster/findAll', { type: SERVICE }),
      pvcs:       this.$store.dispatch('cluster/findAll', { type: PVC })
    };

    if ( this.$store.getters['cluster/schemaFor'](SECRET) ) {
      requests.secrets = this.$store.dispatch('cluster/findAll', { type: SECRET });
    }

    const hash = await allHash(requests);

    this.allSecrets = hash.secrets || [];
    this.allConfigMaps = hash.configMaps;
    this.allNodes = hash.nodes.map(node => node.id);
    this.allServices = hash.services.filter(service => service.spec.clusterIP === 'None');
    this.pvcs = hash.pvcs;
  },

  asyncData(ctx) {
    let resource;
    let parentOverride;

    if ( ctx.params.resource === 'workload') {
      parentOverride = {
        displayName: 'Workload',
        location:    {
          name:    'c-cluster-product-resource',
          params:  { resource: 'workload' },
        }
      };
      resource = WORKLOAD_TYPES.DEPLOYMENT;
    }

    return defaultAsyncData(ctx, resource, parentOverride);
  },

  data() {
    let type = this.$route.params.resource;

    if (type === 'workload') {
      type = null;
    }

    if (!this.value.spec) {
      this.value.spec = {};
    }

    const spec = this.value.spec;

    if (type === WORKLOAD_TYPES.CRON_JOB) {
      if (!spec.jobTemplate) {
        spec.jobTemplate = { spec: { template: { spec: { restartPolicy: 'Never' } } } };
      }
    } else {
      if (!spec.replicas) {
        spec.replicas = 1;
      }

      if (!spec.template) {
        spec.template = { spec: { restartPolicy: type === WORKLOAD_TYPES.JOB ? 'Never' : 'Always' } };
      }
      if (!spec.selector) {
        spec.selector = {};
      }
    }

    return {
      name:             this.value?.metadata?.name || null,
      spec,
      type,
      allConfigMaps:    [],
      allSecrets:       [],
      allServices:   [],
      pvcs:             [],
      allNodes:         null,
      showTabs:         false,
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

    podLabels: {
      get() {
        if (this.isCronJob) {
          if (!this.spec.jobTemplate.metadata) {
            this.$set( this.spec.jobTemplate, 'metadata', { labels: {} });
          }

          return this.spec.jobTemplate.metadata.labels;
        } else {
          if (!this.spec.template.metadata) {
            this.$set(this.spec.template, 'metadata', { labels: {} });
          }

          return this.spec.template.metadata.labels;
        }
      },
      set(neu) {
        if (this.isCronJob) {
          this.$set( this.spec.jobTemplate.metadata, 'labels', neu);
        } else {
          this.$set(this.spec.template.metadata, 'labels', neu);
        }
      }
    },

    podAnnotations: {
      get() {
        if (this.isCronJob) {
          if (!this.spec.jobTemplate.metadata) {
            this.$set( this.spec.jobTemplate, 'metadata', { annotations: {} });
          }

          return this.spec.jobTemplate.metadata.annotations;
        } else {
          if (!this.spec.template.metadata) {
            this.$set(this.spec.template, 'metadata', { annotations: {} });
          }

          return this.spec.template.metadata.annotations;
        }
      },
      set(neu) {
        if (this.isCronJob) {
          this.$set( this.spec.jobTemplate.metadata, 'annotations', neu);
        } else {
          this.$set(this.spec.template.metadata, 'annotations', neu);
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

    headlessServices() {
      return this.allServices.filter(service => service.spec.clusterIP === 'None' && service.metadata.namespace === this.value.metadata.namespace);
    },

    workloadTypes() {
      return omitBy(WORKLOAD_TYPES, (type) => {
        return type === WORKLOAD_TYPES.REPLICA_SET || type === WORKLOAD_TYPES.REPLICATION_CONTROLLER;
      } );
    },

    // array of id, label, description, initials for type selection step
    workloadSubTypes() {
      const out = [];

      for (const prop in this.workloadTypes) {
        const type = this.workloadTypes[prop];
        const subtype = {
          id:          type,
          description: `workload.typeDescriptions.'${ type }'`,
          label:       this.nameDisplayFor(type),
          bannerAbbrv: this.initialDisplayFor(type)
        };

        out.push(subtype);
      }

      return out;
    },

    nameNsColumns() {
      const out = [];

      if (this.isCronJob) {
        out.push('schedule');
      } else if (this.isReplicable) {
        out.push('replicas');

        if (this.isStatefulSet) {
          out.push('service');
        }
      }

      return out;
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

      let restartPolicy;

      if (this.isJob || this.isCronJob) {
        restartPolicy = 'Never';
      } else {
        restartPolicy = 'Always';
      }

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

  created() {
    this.registerBeforeHook(this.saveWorkload, 'willSaveWorkload');
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

      return typeDisplay.split('').filter(letter => letter.match(/[A-Z]/)).join('');
    },

    cancel() {
      this.done();
    },

    saveWorkload() {
      if (this.type !== WORKLOAD_TYPES.JOB) {
        this.spec.selector = { matchLabels: this.value.workloadSelector };
      }

      let template;

      if (this.type === WORKLOAD_TYPES.CRON_JOB) {
        template = this.spec.jobTemplate;
      } else {
        template = this.spec.template;
      }

      if (this.type !== WORKLOAD_TYPES.JOB) {
        if (!template.metadata) {
          template.metadata = { labels: this.value.workloadSelector };
        } else {
          Object.assign(template.metadata.labels, this.value.workloadSelector);
        }
      }

      const nodeAffinity = template?.spec?.affinity?.nodeAffinity || {};
      const podAffinity = template?.spec?.affinity?.podAffinity || {};
      const podAntiAffinity = template?.spec?.affinity?.podAntiAffinity || {};

      this.fixNodeAffinity(nodeAffinity);
      this.fixPodAffinity(podAffinity);
      this.fixPodAffinity(podAntiAffinity);

      delete this.value.kind;

      if (!this.container.name) {
        this.$set(this.container, 'name', this.value.metadata.name);
      }

      Object.assign(this.value, { spec: this.spec });
    },

    // node and pod affinity are formatted incorrectly from API; fix before saving
    fixNodeAffinity(nodeAffinity) {
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
    },

    fixPodAffinity(podAffinity) {
      const preferredDuringSchedulingIgnoredDuringExecution =
        podAffinity.preferredDuringSchedulingIgnoredDuringExecution || [];
      const requiredDuringSchedulingIgnoredDuringExecution =
        podAffinity.requiredDuringSchedulingIgnoredDuringExecution || [];

      preferredDuringSchedulingIgnoredDuringExecution.forEach((term) => {
        const matchExpressions = term?.podAffinityTerm?.labelSelector?.matchExpressions || [];

        matchExpressions.forEach((expression) => {
          if (expression.values) {
            expression.values = typeof expression.values === 'string' ? [expression.values] : [...expression.values];
          }
        });
      });

      requiredDuringSchedulingIgnoredDuringExecution.forEach((term) => {
        const matchExpressions = term?.labelSelector?.matchExpressions || [];

        matchExpressions.forEach((expression) => {
          if (expression.values) {
            expression.values = typeof expression.values === 'string' ? [expression.values] : [...expression.values];
          }
        });
      });

      return podAffinity;
    },

    selectType(type) {
      if (!this.type && type) {
        this.$router.replace({ params: { resource: type } });
      } else {
        this.type = type;
      }
    }
  }
};
</script>

<template>
  <form>
    <CruResource
      :validation-passed="true"
      :selected-subtype="type"
      :resource="value"
      :mode="mode"
      :errors="errors"
      :done-route="doneRoute"
      :subtypes="workloadSubTypes"
      @finish="save"
      @select-type="selectType"
      @error="e=>errors = e"
      @apply-hooks="applyHooks"
    >
      <div class="row">
        <div class="col span-12">
          <NameNsDescription :value="value" :extra-columns="nameNsColumns" :mode="mode" @change="name=value.metadata.name">
            <template #schedule>
              <LabeledInput v-model="spec.schedule" required :mode="mode" :label="t('workload.cronSchedule')" placeholder="0 * * * *" />
              <span class="cron-hint text-small">{{ cronLabel }}</span>
            </template>
            <template #replicas>
              <LabeledInput v-model="spec.replicas" type="number" required :mode="mode" :label="t('workload.replicas')" />
            </template>
            <template #service>
              <LabeledSelect
                v-model="spec.serviceName"
                option-label="metadata.name"
                :reduce="service=>service.metadata.name"
                :mode="mode"
                :label="t('workload.serviceName')"
                :options="headlessServices"
              />
            </template>
          </NameNsDescription>
        </div>
      </div>
      <Tabbed :side-tabs="true">
        <Tab :label="t('workload.container.titles.container')" name="container">
          <div>
            <h3>{{ t('workload.container.titles.image') }}</h3>
            <div class="row">
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

          <hr class="section-divider" />
          <div>
            <h3>{{ t('workload.container.titles.ports') }}</h3>
            <div class="row">
              <WorkloadPorts v-model="container.ports" :mode="mode" />
            </div>
          </div>

          <hr class="section-divider" />
          <div>
            <h3>{{ t('workload.container.titles.command') }}</h3>
            <Command v-model="container" :secrets="namespacedSecrets" :config-maps="namespacedConfigMaps" :mode="mode" />
          </div>
          <hr class="section-divider" />
          <div>
            <h3>{{ t('workload.container.titles.podLabels') }}</h3>
            <div class="row mb-20">
              <KeyValue
                key="labels"
                v-model="podLabels"
                :add-label="t('labels.addLabel')"
                :mode="mode"
                :pad-left="false"
                :read-allowed="false"
                :protip="false"
              />
            </div>
            <h3>{{ t('workload.container.titles.podAnnotations') }}</h3>
            <div class="row">
              <KeyValue
                key="annotations"
                v-model="podAnnotations"
                :add-label="t('labels.addAnnotation')"
                :mode="mode"
                :pad-left="false"
                :read-allowed="false"
                :protip="false"
              />
            </div>
          </div>
        </Tab>
        <Tab :label="t('workload.storage.title')" name="storage">
          <Storage
            v-model="podTemplateSpec"
            :namespace="value.metadata.namespace"
            :register-before-hook="registerBeforeHook"
            :mode="mode"
            :secrets="namespacedSecrets"
            :config-maps="namespacedConfigMaps"
          />
        </Tab>
        <Tab :label="t('workload.container.titles.resources')" name="resources">
          <ContainerResourceLimit v-model="flatResources" :mode="mode" :show-tip="false" />
          <hr class="section-divider" />
          <div>
            <h3 class="mb-10">
              <t k="workload.scheduling.titles.tolerations" />
            </h3>
            <div class="row">
              <Tolerations v-model="podTemplateSpec.tolerations" :mode="mode" />
            </div>
          </div>

          <div>
            <hr class="section-divider" />
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
          <NodeScheduling :mode="mode" :value="podTemplateSpec" :nodes="allNodes" />
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
        <Tab v-if="isStatefulSet" :label="t('workload.container.titles.volumeClaimTemplates')" name="volumeClaimTemplates">
          <VolumeClaimTemplate v-model="spec" :mode="mode" />
        </Tab>
        <Tab name="labels" :label="t('generic.labelsAndAnnotations')">
          <Labels v-model="value" :mode="mode" />
        </Tab>
      </Tabbed>
    </CruResource>
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

.cron-hint {
  color: var(--disabled-text);
  padding: 3px;
}

.next-dropdown{
  display: inline-block;
}
</style>
