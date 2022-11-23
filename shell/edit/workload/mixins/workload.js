import { mapGetters } from 'vuex';
import omitBy from 'lodash/omitBy';
import { cleanUp } from '@shell/utils/object';
import {
  CONFIG_MAP,
  SECRET,
  WORKLOAD_TYPES,
  NODE,
  SERVICE,
  PVC,
  SERVICE_ACCOUNT,
  CAPI,
  POD,
} from '@shell/config/types';
import Tab from '@shell/components/Tabbed/Tab';
import CreateEditView from '@shell/mixins/create-edit-view';
import ResourceManager from '@shell/mixins/resource-manager';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
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

import NodeScheduling from '@shell/components/form/NodeScheduling';
import PodAffinity from '@shell/components/form/PodAffinity';
import Tolerations from '@shell/components/form/Tolerations';
import CruResource from '@shell/components/CruResource';
import Command from '@shell/components/form/Command';
import LifecycleHooks from '@shell/components/form/LifecycleHooks';
import Storage from '@shell/edit/workload/storage';
import ContainerMountPaths from '@shell/edit/workload/storage/ContainerMountPaths.vue';
import Labels from '@shell/components/form/Labels';
import { RadioGroup } from '@components/Form/Radio';
import { UI_MANAGED } from '@shell/config/labels-annotations';
import { removeObject } from '@shell/utils/array';
import { BEFORE_SAVE_HOOKS } from '@shell/mixins/child-hook';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import formRulesGenerator from '@shell/utils/validators/formRules';
import { TYPES as SECRET_TYPES } from '@shell/models/secret';

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
    ContainerResourceLimit,
    Command,
    CruResource,
    HealthCheck,
    Job,
    KeyValue,
    LabeledInput,
    LabeledSelect,
    Labels,
    LifecycleHooks,
    Loading,
    NameNsDescription,
    Networking,
    NodeScheduling,
    PodAffinity,
    RadioGroup,
    Security,
    ServiceNameSelect,
    Storage,
    Tab,
    Tabbed,
    Tolerations,
    Upgrading,
    VolumeClaimTemplate,
    WorkloadPorts,
    ContainerMountPaths
  },

  mixins: [CreateEditView, ResourceManager],

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },

    createOption: {
      default: (text) => {
        if (text) {
          return { metadata: { name: text } };
        }
      },
      type: Function
    },
  },

  async fetch() {
    await this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER });

    // don't block UI for these resources
    this.resourceManagerFetchSecondaryResources(this.secondaryResourceData);
    this.servicesOwned = await this.value.getServicesOwned();
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
      if (this.value.type === POD) {
        const podContainers = [{
          imagePullPolicy: 'Always',
          name:            `container-0`,
        }];

        const metadata = { ...this.value.metadata };

        const podSpec = { template: { spec: { containers: podContainers, initContainers: [] }, metadata } };

        this.$set(this.value, 'spec', podSpec);
      }
    }

    // EDIT view for POD
    // Transform it from POD world to workload
    if ((this.mode === _EDIT || this.mode === _VIEW ) && this.value.type === 'pod' ) {
      const podSpec = { ...this.value.spec };
      const metadata = { ...this.value.metadata };

      this.$set(this.value.spec, 'template', { spec: podSpec, metadata });
    }

    const spec = this.value.spec;
    let podTemplateSpec = type === WORKLOAD_TYPES.CRON_JOB ? spec.jobTemplate.spec.template.spec : spec?.template?.spec;

    let containers = podTemplateSpec.containers || [];
    let container;

    if (this.mode === _VIEW && this.value.type === 'pod' ) {
      podTemplateSpec = spec;
    }

    if (
      this.mode === _CREATE ||
      this.mode === _VIEW ||
      (!createSidecar && !this.value.hasSidecars) // hasSideCars = containers.length > 1 || initContainers.length;
    ) {
      container = containers[0];
    } else {
      // This means that there are no containers.
      if (!podTemplateSpec.initContainers) {
        podTemplateSpec.initContainers = [];
      }
      const allContainers = [
        ...podTemplateSpec.initContainers,
        ...podTemplateSpec.containers,
      ];

      if (this.$route.query.init) {
        podTemplateSpec.initContainers.push({
          imagePullPolicy: 'Always',
          name:            `container-${ allContainers.length }`,
        });

        containers = podTemplateSpec.initContainers;
      }
      if (createSidecar || this.value.type === 'pod') {
        container = {
          imagePullPolicy: 'Always',
          name:            `container-${ allContainers.length }`,
        };

        containers.push(container);
      } else {
        container = containers[0];
      }
    }

    this.selectContainer(container);

    return {
      secondaryResourceData: {
        namespace: this.value?.metadata?.namespace || null,
        data:      {
          [CONFIG_MAP]:      { applyTo: [{ var: 'namespacedConfigMaps' }] },
          [PVC]:             { applyTo: [{ var: 'pvcs' }] },
          [SERVICE_ACCOUNT]: { applyTo: [{ var: 'namespacedServiceNames' }] },
          [SECRET]:          {
            applyTo: [
              { var: 'namespacedSecrets' },
              {
                var:         'imagePullNamespacedSecrets',
                parsingFunc: (data) => {
                  return data.filter(secret => (secret._type === SECRET_TYPES.DOCKER || secret._type === SECRET_TYPES.DOCKER_JSON));
                }
              }
            ]
          },
          [NODE]: {
            applyTo: [
              { var: 'allNodeObjects' },
              {
                var:         'allNodes',
                parsingFunc: (data) => {
                  return data.map(node => node.id);
                }
              }
            ]
          },
          [SERVICE]: {
            applyTo: [
              { var: 'allServices' },
              {
                var:         'headlessServices',
                parsingFunc: (data) => {
                  return data.filter(service => service.spec.clusterIP === 'None');
                }
              }
            ]
          },
        }
      },
      namespacedConfigMaps:       [],
      allNodes:                   null,
      allNodeObjects:             [],
      namespacedSecrets:          [],
      imagePullNamespacedSecrets: [],
      allServices:                [],
      headlessServices:           [],
      name:                       this.value?.metadata?.name || null,
      pvcs:                       [],
      namespacedServiceNames:     [],
      showTabs:                   false,
      pullPolicyOptions:          ['Always', 'IfNotPresent', 'Never'],
      spec,
      type,
      servicesOwned:              [],
      servicesToRemove:           [],
      portsForServices:           [],
      isInitContainer,
      container,
      containerChange:            0,
      tabChange:                  0,
      podFsGroup:                 podTemplateSpec.securityContext?.fsGroup,
      savePvcHookName:            'savePvcHook',
      tabWeightMap:               TAB_WEIGHT_MAP,
      fvFormRuleSets:             [{
        path: 'image', rootObject: this.container, rules: ['required'], translationKey: 'workload.container.image'
      }],
      fvReportedValidationPaths: ['spec'],
      isNamespaceNew:            false,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    tabErrors() {
      return { general: this.fvGetPathErrors(['image'])?.length > 0 };
    },

    defaultTab() {
      if (!!this.$route.query.sidecar || this.$route.query.init || this.mode === _CREATE) {
        return 'container-0';
      }

      return this.allContainers.length ? this.allContainers[0].name : '';
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

    isDeployment() {
      return this.type === WORKLOAD_TYPES.DEPLOYMENT;
    },

    isPod() {
      return this.value.type === POD;
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
      },
    },

    podLabels: {
      get() {
        if (this.isCronJob) {
          if (!this.spec.jobTemplate.metadata) {
            this.$set(this.spec.jobTemplate, 'metadata', { labels: {} });
          }

          return this.spec.jobTemplate.metadata.labels;
        }

        if (!this.spec.template.metadata) {
          this.$set(this.spec.template, 'metadata', { labels: {} });
        }

        return this.spec.template.metadata.labels;
      },
      set(neu) {
        if (this.isCronJob) {
          this.$set(this.spec.jobTemplate.metadata, 'labels', neu);
        } else {
          this.$set(this.spec.template.metadata, 'labels', neu);
        }
      },
    },

    podAnnotations: {
      get() {
        if (this.isCronJob) {
          if (!this.spec.jobTemplate.metadata) {
            this.$set(this.spec.jobTemplate, 'metadata', { annotations: {} });
          }

          return this.spec.jobTemplate.metadata.annotations;
        }
        if (!this.spec.template.metadata) {
          this.$set(this.spec.template, 'metadata', { annotations: {} });
        }

        return this.spec.template.metadata.annotations;
      },
      set(neu) {
        if (this.isCronJob) {
          this.$set(this.spec.jobTemplate.metadata, 'annotations', neu);
        } else {
          this.$set(this.spec.template.metadata, 'annotations', neu);
        }
      },
    },

    allContainers() {
      const containers = this.podTemplateSpec?.containers || [];
      const initContainers = this.podTemplateSpec?.initContainers || [];

      return [
        ...containers,
        ...initContainers.map((each) => {
          each._init = true;

          return each;
        }),
      ].map((container) => {
        const containerImageRule = formRulesGenerator(this.$store.getters['i18n/t'], { name: container.name }).containerImage;

        container.error = containerImageRule(container);

        return container;
      });
    },

    flatResources: {
      get() {
        const { limits = {}, requests = {} } = this.container.resources || {};
        const {
          cpu: limitsCpu,
          memory: limitsMemory,
          [GPU_KEY]: limitsGpu,
        } = limits;
        const { cpu: requestsCpu, memory: requestsMemory } = requests;

        return {
          limitsCpu,
          limitsMemory,
          requestsCpu,
          requestsMemory,
          limitsGpu,
        };
      },
      set(neu) {
        const {
          limitsCpu,
          limitsMemory,
          requestsCpu,
          requestsMemory,
          limitsGpu,
        } = neu;

        const out = {
          requests: {
            cpu:    requestsCpu,
            memory: requestsMemory,
          },
          limits: {
            cpu:       limitsCpu,
            memory:    limitsMemory,
            [GPU_KEY]: limitsGpu,
          },
        };

        this.$set(this.container, 'resources', cleanUp(out));
      },
    },

    healthCheck: {
      get() {
        const { readinessProbe, livenessProbe, startupProbe } = this.container;

        return {
          readinessProbe,
          livenessProbe,
          startupProbe,
        };
      },
      set(neu) {
        Object.assign(this.container, neu);
      },
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
      },
    },

    schema() {
      return this.$store.getters['cluster/schemaFor'](this.type);
    },

    workloadTypes() {
      return omitBy(WORKLOAD_TYPES, (type) => {
        return (
          type === WORKLOAD_TYPES.REPLICA_SET ||
          type === WORKLOAD_TYPES.REPLICATION_CONTROLLER
        );
      });
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
          bannerAbbrv: this.initialDisplayFor(type),
        };

        out.push(subtype);
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

    ...mapGetters({ t: 'i18n/t' }),
  },

  watch: {
    async 'value.metadata.namespace'(neu) {
      if (this.isNamespaceNew) {
        // we don't need to re-fetch namespace specific (or non-namespace specific) resources when the namespace hasn't been created yet
        return;
      }
      this.secondaryResourceData.namespace = neu;
      // Fetch resources that are namespace specific, we don't need to re-fetch non-namespaced resources on namespace change
      this.resourceManagerFetchSecondaryResources(this.secondaryResourceData, true);

      this.servicesOwned = await this.value.getServicesOwned();
    },

    isNamespaceNew(neu, old) {
      if (!old && neu) {
        // As the namespace is new any resource that's been fetched with a namespace is now invalid
        this.resourceManagerClearSecondaryResources(this.secondaryResourceData, true);
      }
    },

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
      const existing = containers.find(container => container.__active) || {};

      Object.assign(existing, neu);
    },
  },

  created() {
    this.registerBeforeHook(this.saveWorkload, 'willSaveWorkload');
    this.registerBeforeHook(this.getPorts, 'getPorts');

    this.registerAfterHook(this.saveService, 'saveService');
  },

  methods: {
    addContainerBtn() {
      this.selectContainer({ name: 'Add Container', __add: true });
    },
    nameDisplayFor(type) {
      const schema = this.$store.getters['cluster/schemaFor'](type);

      return this.$store.getters['type-map/labelFor'](schema) || '';
    },

    // TODO better images for workload types?
    // show initials of workload type in blue circles for now
    initialDisplayFor(type) {
      const typeDisplay = this.nameDisplayFor(type);

      return typeDisplay
        .split('')
        .filter(letter => letter.match(/[A-Z]/))
        .join('');
    },

    cancel() {
      this.done();
    },

    async getPorts() {
      const ports = (await this.value.getPortsWithServiceType()) || [];

      this.portsForServices = ports;
    },

    async saveService() {
      // If we can't access services then just return - the UI should only allow ports without service creation
      if (!this.$store.getters['cluster/schemaFor'](SERVICE)) {
        return;
      }

      const { toSave = [], toRemove = [] } =
        (await this.value.servicesFromContainerPorts(
          this.mode,
          this.portsForServices
        )) || {};

      this.servicesOwned = toSave;
      this.servicesToRemove = toRemove;

      if (!toSave.length && !toRemove.length) {
        return;
      }

      return Promise.all([
        ...toSave.map(svc => svc.save()),
        ...toRemove.map((svc) => {
          const ui = svc?.metadata?.annotations[UI_MANAGED];

          if (ui) {
            svc.remove();
          }
        }),
      ]);
    },

    saveWorkload() {
      if (
        this.type !== WORKLOAD_TYPES.JOB &&
        this.type !== WORKLOAD_TYPES.CRON_JOB &&
        this.mode === _CREATE
      ) {
        this.spec.selector = { matchLabels: this.value.workloadSelector };
        Object.assign(this.value.metadata.labels, this.value.workloadSelector);
      }

      let template;

      if (this.type === WORKLOAD_TYPES.CRON_JOB) {
        template = this.spec.jobTemplate;
      } else {
        template = this.spec.template;
      }

      // WORKLOADS
      if (
        this.type !== WORKLOAD_TYPES.JOB &&
        this.type !== WORKLOAD_TYPES.CRON_JOB &&
        this.mode === _CREATE
      ) {
        if (!template.metadata) {
          template.metadata = { labels: this.value.workloadSelector };
        } else {
          Object.assign(template.metadata.labels, this.value.workloadSelector);
        }
      }

      if (template.spec.containers && template.spec.containers[0]) {
        const containerResources = template.spec.containers[0].resources;
        const nvidiaGpuLimit =
          template.spec.containers[0].resources?.limits?.[GPU_KEY];

        // Though not required, requests are also set to mirror the ember ui
        if (nvidiaGpuLimit > 0) {
          containerResources.requests = containerResources.requests || {};
          containerResources.requests[GPU_KEY] = nvidiaGpuLimit;
        }

        if (!this.nvidiaIsValid(nvidiaGpuLimit)) {
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

        total.push(
          ...containerPorts.filter(
            port => port._serviceType && port._serviceType !== ''
          )
        );

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
            expression.values =
              typeof expression.values === 'string' ? [expression.values] : [...expression.values];
          }
        });
      });

      (
        requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms || []
      ).forEach((term) => {
        const matchExpressions = term.matchExpressions || [];

        matchExpressions.forEach((expression) => {
          if (expression.values) {
            expression.values =
              typeof expression.values === 'string' ? [expression.values] : [...expression.values];
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
        const matchExpressions =
          term?.podAffinityTerm?.labelSelector?.matchExpressions || [];

        matchExpressions.forEach((expression) => {
          if (expression.values) {
            expression.values =
              typeof expression.values === 'string' ? [expression.values] : [...expression.values];
          }
        });
      });

      requiredDuringSchedulingIgnoredDuringExecution.forEach((term) => {
        const matchExpressions = term?.labelSelector?.matchExpressions || [];

        matchExpressions.forEach((expression) => {
          if (expression.values) {
            expression.values =
              typeof expression.values === 'string' ? [expression.values] : [...expression.values];
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
      const container = {
        imagePullPolicy: 'Always',
        name:            `container-${ nameNumber }`,
        active:          true
      };

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
      if ( !Number.isInteger(parseInt(nvidiaGpuLimit)) ) {
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
    },
  },
};
