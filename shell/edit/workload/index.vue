<script>
import omitBy from 'lodash/omitBy';
import { cleanUp } from '@shell/utils/object';
import {
  CONFIG_MAP, SECRET, WORKLOAD_TYPES, NODE, SERVICE, PVC, SERVICE_ACCOUNT, CAPI
} from '@shell/config/types';
import Tab from '@shell/components/Tabbed/Tab';
import CreateEditView from '@shell/mixins/create-edit-view';
import { allHash } from '@shell/utils/promise';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LabeledInput from '@shell/components/form/LabeledInput';
import ServiceNameSelect from '@shell/components/form/ServiceNameSelect';
import HealthCheck from '@shell/components/form/HealthCheck';
import Security from '@shell/components/form/Security';
import Upgrading from '@shell/edit/workload/Upgrading';
import Loading from '@shell/components/Loading';
import Networking from '@shell/components/form/Networking';
import VolumeClaimTemplate from '@shell/edit/workload/VolumeClaimTemplate';
import Job from '@shell/edit/workload/Job';
import { _EDIT, _CREATE, _VIEW } from '@shell/config/query-params';
import WorkloadPorts from '@shell/components/form/WorkloadPorts';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit';
import KeyValue from '@shell/components/form/KeyValue';
import Tabbed from '@shell/components/Tabbed';
import { mapGetters } from 'vuex';
import NodeScheduling from '@shell/components/form/NodeScheduling';
import PodAffinity from '@shell/components/form/PodAffinity';
import Tolerations from '@shell/components/form/Tolerations';
import CruResource from '@shell/components/CruResource';
import Command from '@shell/components/form/Command';
import LifecycleHooks from '@shell/components/form/LifecycleHooks';
import Storage from '@shell/edit/workload/storage';
import Labels from '@shell/components/form/Labels';
import RadioGroup from '@shell/components/form/RadioGroup';
import { UI_MANAGED } from '@shell/config/labels-annotations';
import { removeObject } from '@shell/utils/array';
import { BEFORE_SAVE_HOOKS } from '@shell/mixins/child-hook';

const TAB_WEIGHT_MAP = {
  general:              99,
  healthCheck:          98,
  labels:               97,
  networking:           96,
  nodeScheduling:       95,
  podScheduling:        94,
  resources:            93,
  upgrading:            92,
  securityContext:      91,
  storage:              90,
  volumeClaimTemplates: 89,
};

const GPU_KEY = 'nvidia.com/gpu';

export default {
  name:       'CruWorkload',
  components: {
    Loading,
    NameNsDescription,
    LabeledSelect,
    LabeledInput,
    ServiceNameSelect,
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
    PodAffinity,
    NodeScheduling,
    Tolerations,
    CruResource,
    Command,
    LifecycleHooks,
    Storage,
    VolumeClaimTemplate,
    Labels,
    RadioGroup,
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
    const requests = { rancherClusters: this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }) };
    const needed = {
      configMaps: CONFIG_MAP,
      nodes:      NODE,
      services:   SERVICE,
      pvcs:       PVC,
      sas:        SERVICE_ACCOUNT,
      secrets:    SECRET,
    };

    // Only fetch types if the user can see them
    Object.keys(needed).forEach((key) => {
      const type = needed[key];

      if (this.$store.getters['cluster/schemaFor'](type)) {
        requests[key] = this.$store.dispatch('cluster/findAll', { type });
      }
    });

    const hash = await allHash(requests);

    this.servicesOwned = hash.services ? await this.value.getServicesOwned() : [];

    this.allSecrets = hash.secrets || [];
    this.allConfigMaps = hash.configMaps || [];
    this.allNodeObjects = hash.nodes || [];
    this.allNodes = this.allNodeObjects.map(node => node.id);
    this.allServices = hash.services || [];
    this.pvcs = hash.pvcs || [];
    this.sas = hash.sas || [];
  },

  data() {
    let type = this.$route.params.resource;
    const createSidecar = !!this.$route.query.sidecar;
    const isInitContainer = !!this.$route.query.init;

    if (type === 'workload') {
      type = null;
    }

    if (!this.value.spec) {
      this.value.spec = {};
    }

    const spec = this.value.spec;
    let container;
    const podTemplateSpec = type === WORKLOAD_TYPES.CRON_JOB ? spec.jobTemplate.spec.template.spec : spec?.template?.spec;
    let containers = podTemplateSpec.containers;

    if (this.mode === _CREATE || this.mode === _VIEW || (!createSidecar && !this.value.hasSidecars)) {
      container = containers[0];
    } else {
      if (!podTemplateSpec.initContainers) {
        podTemplateSpec.initContainers = [];
      }
      const allContainers = [...podTemplateSpec.initContainers, ...podTemplateSpec.containers];

      if (this.$route.query.init) {
        podTemplateSpec.initContainers.push({ imagePullPolicy: 'Always', name: `container-${ allContainers.length }` });
        containers = podTemplateSpec.initContainers;
      }
      if (createSidecar) {
        container = { imagePullPolicy: 'Always', name: `container-${ allContainers.length }` };
        containers.push(container);
      } else {
        container = containers[0];
      }
    }

    this.selectContainer(container);

    return {
      allConfigMaps:     [],
      allNodes:          null,
      allNodeObjects:    [],
      allSecrets:        [],
      allServices:       [],
      name:              this.value?.metadata?.name || null,
      pvcs:              [],
      sas:               [],
      showTabs:          false,
      pullPolicyOptions: ['Always', 'IfNotPresent', 'Never'],
      spec,
      type,
      servicesOwned:     [],
      servicesToRemove:    [],
      portsForServices:  [],
      isInitContainer,
      container,
      containerChange:   0,
      podFsGroup:        podTemplateSpec.securityContext?.fsGroup,
      savePvcHookName:   'savePvcHook',
      tabWeightMap:      TAB_WEIGHT_MAP,
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

    allContainers() {
      const containers = this.podTemplateSpec?.containers || [];
      const initContainers = this.podTemplateSpec?.initContainers || [];

      return [...containers, ...initContainers.map((each) => {
        each._init = true;

        return each;
      })];
    },

    flatResources: {
      get() {
        const { limits = {}, requests = {} } = this.container.resources || {};
        const { cpu: limitsCpu, memory: limitsMemory, [GPU_KEY]: limitsGpu } = limits;
        const { cpu: requestsCpu, memory: requestsMemory } = requests;

        return {
          limitsCpu, limitsMemory, requestsCpu, requestsMemory, limitsGpu
        };
      },
      set(neu) {
        const {
          limitsCpu, limitsMemory, requestsCpu, requestsMemory, limitsGpu
        } = neu;

        const out = {
          requests: {
            cpu:    requestsCpu,
            memory: requestsMemory
          },
          limits: {
            cpu:       limitsCpu,
            memory:    limitsMemory,
            [GPU_KEY]: limitsGpu
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

    imagePullSecrets: {
      get() {
        if (!this.podTemplateSpec.imagePullSecrets) {
          this.$set(this.podTemplateSpec, 'imagePullSecrets', []);
        }

        const { imagePullSecrets } = this.podTemplateSpec;

        return imagePullSecrets.map(each => each.name);
      },
      set(neu) {
        this.podTemplateSpec.imagePullSecrets = neu.map((secret) => {
          return { name: secret };
        });
      }

    },

    schema() {
      return this.$store.getters['cluster/schemaFor'](this.type);
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

    namespacedServiceNames() {
      const { namespace } = this.value?.metadata;

      if (namespace) {
        return this.sas.filter(
          serviceName => serviceName.metadata.namespace === namespace
        );
      } else {
        return this.sas;
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

    containerOptions() {
      const out = [...this.allContainers];

      if (!this.isView) {
        out.push({ name: 'Add Container', __add: true });
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

    container(neu) {
      const containers = this.isInitContainer ? this.podTemplateSpec.initContainers : this.podTemplateSpec.containers;
      const existing = containers.filter(container => container.__active)[0];

      Object.assign(existing, neu);
    }
  },

  created() {
    this.registerBeforeHook(this.saveWorkload, 'willSaveWorkload');
    this.registerBeforeHook(this.getPorts, 'getPorts');

    this.registerAfterHook(this.saveService, 'saveService');
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

    async getPorts() {
      const ports = await this.value.getPortsWithServiceType() || [];

      this.portsForServices = ports;
    },

    async saveService() {
      // If we can't access services then just return - the UI should only allow ports without service creation
      if (!this.$store.getters['cluster/schemaFor'](SERVICE)) {
        return;
      }

      const { toSave = [], toRemove = [] } = await this.value.servicesFromContainerPorts(this.mode, this.portsForServices) || {};

      this.servicesOwned = toSave;
      this.servicesToRemove = toRemove;

      if (!toSave.length && !toRemove.length) {
        return;
      }

      return Promise.all([...toSave.map(svc => svc.save()), ...toRemove.map((svc) => {
        const ui = svc?.metadata?.annotations[UI_MANAGED];

        if (ui) {
          svc.remove();
        }
      })]);
    },

    saveWorkload() {
      if (this.type !== WORKLOAD_TYPES.JOB && this.type !== WORKLOAD_TYPES.CRON_JOB && this.mode === _CREATE) {
        this.spec.selector = { matchLabels: this.value.workloadSelector };
        Object.assign(this.value.metadata.labels, this.value.workloadSelector);
      }

      let template;

      if (this.type === WORKLOAD_TYPES.CRON_JOB) {
        template = this.spec.jobTemplate;
      } else {
        template = this.spec.template;
      }

      if (this.type !== WORKLOAD_TYPES.JOB && this.type !== WORKLOAD_TYPES.CRON_JOB && this.mode === _CREATE) {
        if (!template.metadata) {
          template.metadata = { labels: this.value.workloadSelector };
        } else {
          Object.assign(template.metadata.labels, this.value.workloadSelector);
        }
      }

      if (template.spec.containers && template.spec.containers[0]) {
        const containerResources = template.spec.containers[0].resources;
        const nvidiaGpuLimit = template.spec.containers[0].resources?.limits?.[GPU_KEY];

        // Though not required, requests are also set to mirror the ember ui
        if (nvidiaGpuLimit > 0) {
          containerResources.requests = containerResources.requests || {};
          containerResources.requests[GPU_KEY] = nvidiaGpuLimit;
        }

        if (!this.nvidiaIsValid(nvidiaGpuLimit) ) {
          try {
            delete containerResources.requests[GPU_KEY];
            delete containerResources.limits[GPU_KEY];

            if (Object.keys(containerResources.limits).length === 0) {
              delete containerResources.limits;
            }
            if (Object.keys(containerResources.requests).length === 0) {
              delete containerResources.requests;
            }
            if (Object.keys(containerResources).length === 0) {
              delete template.spec.containers[0].resources;
            }
          } catch {}
        }
      }

      const nodeAffinity = template?.spec?.affinity?.nodeAffinity || {};
      const podAffinity = template?.spec?.affinity?.podAffinity || {};
      const podAntiAffinity = template?.spec?.affinity?.podAntiAffinity || {};

      this.fixNodeAffinity(nodeAffinity);
      this.fixPodAffinity(podAffinity);
      this.fixPodAffinity(podAntiAffinity);
      this.fixPodSecurityContext(this.podTemplateSpec);

      // delete this.value.kind;
      if (this.container && !this.container.name) {
        this.$set(this.container, 'name', this.value.metadata.name);
      }

      const ports = this.value.containers.reduce((total, each) => {
        const containerPorts = each.ports || [];

        total.push(...containerPorts.filter(port => port._serviceType && port._serviceType !== ''));

        return total;
      }, []);

      // ports contain info used to create services after saving
      this.portsForServices = ports;
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

    fixPodSecurityContext(podTempSpec) {
      if (this.podFsGroup) {
        podTempSpec.securityContext = podTempSpec.securityContext || {};
        podTempSpec.securityContext.fsGroup = this.podFsGroup;
      } else {
        if (podTempSpec.securityContext?.fsGroup) {
          delete podTempSpec.securityContext.fsGroup;
        }
        if (Object.keys(podTempSpec.securityContext || {}).length === 0) {
          delete podTempSpec.securityContext;
        }
      }
    },

    selectType(type) {
      if (!this.type && type) {
        this.$router.replace({ params: { resource: type } });
      } else {
        this.type = type;
      }
    },

    selectContainer(container) {
      if (container.__add) {
        this.addContainer();

        return;
      }
      (this.allContainers || []).forEach((container) => {
        if (container.__active) {
          delete container.__active;
        }
      });
      container.__active = true;
      this.container = container;
      this.isInitContainer = !!container._init;
      this.containerChange++;
    },

    addContainer() {
      let nameNumber = this.allContainers.length;
      const allNames = this.allContainers.reduce((names, each) => {
        names.push(each.name);

        return names;
      }, []);

      while (allNames.includes(`container-${ nameNumber }`)) {
        nameNumber++;
      }
      const container = { imagePullPolicy: 'Always', name: `container-${ nameNumber }` };

      this.podTemplateSpec.containers.push(container);
      this.selectContainer(container);
    },

    removeContainer(container) {
      if (container._init) {
        removeObject(this.podTemplateSpec.initContainers, container);
      } else {
        removeObject(this.podTemplateSpec.containers, container);
      }
      this.selectContainer(this.allContainers[0]);
    },

    updateInitContainer(neu) {
      if (!this.container) {
        return;
      }
      const containers = this.podTemplateSpec.containers;

      if (neu) {
        if (!this.podTemplateSpec.initContainers) {
          this.podTemplateSpec.initContainers = [];
        }
        this.podTemplateSpec.initContainers.push(this.container);

        removeObject(containers, this.container);
      } else {
        delete this.container._init;
        const initContainers = this.podTemplateSpec.initContainers;

        removeObject(initContainers, this.container);
        containers.push(this.container);
      }
      this.isInitContainer = neu;
    },
    clearPvcFormState(hookName) {
      // On the `closePvcForm` event, remove the
      // before save hook to prevent the PVC from
      // being created. Use the PVC's unique ID to distinguish
      // between hooks for different PVCs.
      if (this[BEFORE_SAVE_HOOKS]) {
        this.unregisterBeforeSaveHook(hookName);
      }
    },

    updateServiceAccount(neu) {
      if (neu) {
        this.podTemplateSpec.serviceAccount = neu;
        this.podTemplateSpec.serviceAccountName = neu;
      } else {
        // Note - both have to be removed in order for removal to work
        delete this.podTemplateSpec.serviceAccount;
        delete this.podTemplateSpec.serviceAccountName;
      }
    },
    nvidiaIsValid(nvidiaGpuLimit) {
      if (!Number.isInteger(nvidiaGpuLimit)) {
        return false;
      }
      if (nvidiaGpuLimit === undefined) {
        return false;
      }
      if (nvidiaGpuLimit < 1) {
        return false;
      } else {
        return true;
      }

      //
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <form v-else class="filled-height">
    <CruResource
      :validation-passed="true"
      :selected-subtype="type"
      :resource="value"
      :mode="mode"
      :errors="errors"
      :done-route="doneRoute"
      :subtypes="workloadSubTypes"
      :apply-hooks="applyHooks"
      @finish="save"
      @select-type="selectType"
      @error="e=>errors = e"
    >
      <div class="row">
        <div class="col span-12">
          <NameNsDescription :value="value" :extra-columns="nameNsColumns" :mode="mode" @change="name=value.metadata.name">
            <template #schedule>
              <LabeledInput
                v-model="spec.schedule"
                type="cron"
                required
                :mode="mode"
                :label="t('workload.cronSchedule')"
                placeholder="0 * * * *"
              />
            </template>
            <template #replicas>
              <LabeledInput
                v-model.number="spec.replicas"
                type="number"
                min="0"
                required
                :mode="mode"
                :label="t('workload.replicas')"
              />
            </template>
            <template #service>
              <LabeledSelect
                v-model="spec.serviceName"
                option-label="metadata.name"
                :reduce="service=>service.metadata.name"
                :mode="mode"
                :label="t('workload.serviceName')"
                :options="headlessServices"
                required
              />
            </template>
          </NameNsDescription>
        </div>
      </div>
      <div v-if="containerOptions.length > 1" class="container-row">
        <div class="col span-4">
          <LabeledSelect :value="container" option-label="name" :label="t('workload.container.titles.container')" :options="containerOptions" @input="selectContainer" />
        </div>
        <div v-if="allContainers.length > 1 && !isView" class="col">
          <button type="button" class="btn-sm role-link" @click="removeContainer(container)">
            {{ t('workload.container.removeContainer') }}
          </button>
        </div>
      </div>
      <Tabbed :key="containerChange" :side-tabs="true">
        <Tab :label="t('workload.container.titles.general')" name="general" :weight="tabWeightMap['general']">
          <div>
            <div :style="{'align-items':'center'}" class="row mb-20">
              <div class="col span-6">
                <LabeledInput v-model="container.name" :mode="mode" :label="t('workload.container.containerName')" />
              </div>
              <div class="col span-6">
                <RadioGroup
                  :mode="mode"
                  :value="isInitContainer"
                  name="initContainer"
                  :options="[true, false]"
                  :labels="[t('workload.container.init'), t('workload.container.standard')]"
                  @input="updateInitContainer"
                />
              </div>
            </div>
            <h3>{{ t('workload.container.titles.image') }}</h3>
            <div class="row mb-20">
              <div class="col span-6">
                <LabeledInput
                  v-model.trim="container.image"
                  :mode="mode"
                  :label="t('workload.container.image')"
                  :placeholder="t('generic.placeholder', {text: 'nginx:latest'}, true)"
                  required
                />
              </div>
              <div class="col span-6">
                <LabeledSelect
                  v-model="container.imagePullPolicy"
                  :label="t('workload.container.imagePullPolicy')"
                  :options="pullPolicyOptions"
                  :mode="mode"
                />
              </div>
            </div>
            <div class="row">
              <div class="col span-6">
                <LabeledSelect
                  v-model="imagePullSecrets"
                  :label="t('workload.container.imagePullSecrets')"
                  :multiple="true"
                  :taggable="true"
                  :options="namespacedSecrets"
                  :mode="mode"
                  option-label="metadata.name"
                  :reduce="service=>service.metadata.name"
                />
              </div>
            </div>
          </div>

          <div class="spacer"></div>
          <div>
            <h3>{{ t('workload.container.titles.ports') }}</h3>
            <div class="row">
              <WorkloadPorts v-model="container.ports" :name="value.metadata.name" :services="servicesOwned" :mode="mode" />
            </div>
          </div>

          <div class="spacer"></div>
          <div>
            <h3>{{ t('workload.container.titles.command') }}</h3>
            <Command v-model="container" :secrets="namespacedSecrets" :config-maps="namespacedConfigMaps" :mode="mode" />
          </div>
          <ServiceNameSelect
            :value="podTemplateSpec.serviceAccountName"
            :mode="mode"
            :select-label="t('workload.serviceAccountName.label')"
            :select-placeholder="t('workload.serviceAccountName.label')"
            :options="namespacedServiceNames"
            option-label="metadata.name"
            @input="updateServiceAccount"
          />

          <div class="spacer"></div>
          <div>
            <h3>{{ t('workload.container.titles.lifecycle') }}</h3>
            <LifecycleHooks v-model="container.lifecycle" :mode="mode" />
          </div>
        </Tab>
        <Tab :label="t('workload.storage.title')" name="storage" :weight="tabWeightMap['storage']">
          <Storage
            v-model="podTemplateSpec"
            :namespace="value.metadata.namespace"
            :register-before-hook="registerBeforeHook"
            :mode="mode"
            :secrets="namespacedSecrets"
            :config-maps="namespacedConfigMaps"
            :container="container"
            :save-pvc-hook-name="savePvcHookName"
            @removePvcForm="clearPvcFormState"
          />
        </Tab>
        <Tab :label="t('workload.container.titles.resources')" name="resources" :weight="tabWeightMap['resources']">
          <h3 class="mb-10">
            <t k="workload.scheduling.titles.limits" />
          </h3>
          <ContainerResourceLimit v-model="flatResources" :mode="mode" :show-tip="false" />
          <template>
            <div class="spacer"></div>
            <div>
              <h3 class="mb-10">
                <t k="workload.scheduling.titles.tolerations" />
              </h3>
              <div class="row">
                <Tolerations v-model="podTemplateSpec.tolerations" :mode="mode" />
              </div>
            </div>

            <div>
              <div class="spacer"></div>
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
          </template>
        </Tab>
        <Tab :label="t('workload.container.titles.podScheduling')" name="podScheduling" :weight="tabWeightMap['podScheduling']">
          <PodAffinity :mode="mode" :value="podTemplateSpec" :nodes="allNodeObjects" />
        </Tab>
        <Tab :label="t('workload.container.titles.nodeScheduling')" name="nodeScheduling" :weight="tabWeightMap['nodeScheduling']">
          <NodeScheduling :mode="mode" :value="podTemplateSpec" :nodes="allNodes" />
        </Tab>
        <Tab :label="t('workload.container.titles.upgrading')" name="upgrading" :weight="tabWeightMap['upgrading']">
          <Job v-if="isJob || isCronJob" v-model="spec" :mode="mode" :type="type" />
          <Upgrading v-else v-model="spec" :mode="mode" :type="type" />
        </Tab>
        <Tab v-if="!isInitContainer" :label="t('workload.container.titles.healthCheck')" name="healthCheck" :weight="tabWeightMap['healthCheck']">
          <HealthCheck v-model="healthCheck" :mode="mode" />
        </Tab>
        <Tab :label="t('workload.container.titles.securityContext')" name="securityContext" :weight="tabWeightMap['securityContext']">
          <Security v-model="container.securityContext" :mode="mode" />
          <div class="spacer"></div>
          <div>
            <h3>{{ t('workload.container.security.podFsGroup') }}</h3>
            <div class="row">
              <div class="col span-6">
                <LabeledInput v-model.number="podFsGroup" type="number" :mode="mode" :label="t('workload.container.security.fsGroup')" />
              </div>
            </div>
          </div>
        </Tab>
        <Tab :label="t('workload.container.titles.networking')" name="networking" :weight="tabWeightMap['networking']">
          <Networking v-model="podTemplateSpec" :mode="mode" />
        </Tab>
        <Tab v-if="isStatefulSet" :label="t('workload.container.titles.volumeClaimTemplates')" name="volumeClaimTemplates" :weight="tabWeightMap['volumeClaimTemplates']">
          <VolumeClaimTemplate v-model="spec" :mode="mode" />
        </Tab>
        <Tab name="labels" label-key="generic.labelsAndAnnotations" :weight="tabWeightMap['labels']">
          <Labels v-model="value" :mode="mode" />
          <div class="spacer"></div>

          <div>
            <h3>{{ t('workload.container.titles.podLabels') }}</h3>
            <div class="row mb-20">
              <KeyValue
                key="labels"
                v-model="podLabels"
                :add-label="t('labels.addLabel')"
                :mode="mode"
                :read-allowed="false"
                :protip="false"
              />
            </div>
            <div class="spacer"></div>
            <h3>{{ t('workload.container.titles.podAnnotations') }}</h3>
            <div class="row">
              <KeyValue
                key="annotations"
                v-model="podAnnotations"
                :add-label="t('labels.addAnnotation')"
                :mode="mode"
                :read-allowed="false"
                :protip="false"
              />
            </div>
          </div>
        </Tab>
      </Tabbed>
    </CruResource>
  </form>
</template>

<style lang='scss'>
.container-row{
  display: flex;
  align-items: center;
  margin-bottom: 20px;
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

.next-dropdown{
  display: inline-block;
}
</style>
