
import { findBy } from '@shell/utils/array';
import { TARGET_WORKLOADS, UI_MANAGED, HCI as HCI_LABELS_ANNOTATIONS } from '@shell/config/labels-annotations';
import {
  WORKLOAD_TYPES, SERVICE, POD, CONFIG_MAP, SECRET, SERVICE_ACCOUNT, PVC, HPA, POD_DISRUPTION_BUDGET, NETWORK_POLICY
} from '@shell/config/types';
import { clone, get } from '@shell/utils/object';
import SteveModel from '@shell/plugins/steve/steve-class';
import { shortenedImage } from '@shell/utils/string';
import { stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import {
  apiGroupOf, findAllOf, findIfExists, isClaimFromTemplate, podSpecReferences, relatedEntry, selectsLabels
} from '@shell/utils/editable-related-resources';

export default class WorkloadService extends SteveModel {
  get stateDisplay() {
    return stateDisplay(this.state, true);
  }

  /**
   * The template of the pods this workload creates. A CronJob nests it in its job template, and a
   * pod is its own template
   */
  get podTemplate() {
    if (this.type === WORKLOAD_TYPES.CRON_JOB) {
      return this.spec?.jobTemplate?.spec?.template;
    }

    return this.type === POD ? { metadata: this.metadata, spec: this.spec } : this.spec?.template;
  }

  /**
   * The names of the resources the pod template refers to, by type. See `podSpecReferences`
   */
  get podReferences() {
    return podSpecReferences(this.podTemplate?.spec);
  }

  /**
   * The volume claim templates of a StatefulSet, empty for any other type
   */
  get claimTemplates() {
    return this.type === WORKLOAD_TYPES.STATEFUL_SET ? this.spec?.volumeClaimTemplates || [] : [];
  }

  /**
   * The volume claim template that the claim named `claimName` was created from
   */
  claimTemplateFor(claimName) {
    return this.claimTemplates.find((template) => isClaimFromTemplate(claimName, template.metadata?.name, this.metadata?.name));
  }

  /**
   * The names of the claims created for a pod's generic ephemeral volumes, `<pod>-<volume>`
   *
   * See https://kubernetes.io/docs/concepts/storage/ephemeral-volumes/#persistentvolumeclaim-naming
   */
  get ephemeralClaimNames() {
    if (this.type !== POD) {
      return [];
    }

    return (this.spec?.volumes || []).filter((volume) => volume?.ephemeral).map((volume) => `${ this.metadata?.name }-${ volume.name }`);
  }

  /**
   * Do the pods of this workload use the resource of `type` named `name`?
   *
   * For a PersistentVolumeClaim that includes the claims a StatefulSet creates from its templates
   *
   * @param {string} type
   * @param {string} name
   * @returns {boolean}
   */
  usesResource(type, name) {
    if (this.podReferences.names[type]?.has(name)) {
      return true;
    }

    return type === PVC && (!!this.claimTemplateFor(name) || this.ephemeralClaimNames.includes(name));
  }

  /**
   * Does the label selector select the pods of this workload?
   *
   * @param {Object} labelSelector `matchLabels` and `matchExpressions`
   * @returns {boolean}
   */
  hasPodsSelectedBy(labelSelector) {
    return selectsLabels(labelSelector, this.podTemplate?.metadata?.labels);
  }

  /**
   * Does `service` send traffic to the pods of this workload?
   *
   * Either its selector selects them, it was created from this workload's container ports, or it
   * is the governing Service of this StatefulSet
   *
   * @param {Object} service
   * @returns {boolean}
   */
  isSelectedByService(service) {
    if (service?.metadata?.namespace !== this.metadata?.namespace) {
      return false;
    }

    return this.isServiceFromContainerPorts(service) ||
      (this.type === WORKLOAD_TYPES.STATEFUL_SET && !!this.spec?.serviceName && service.metadata?.name === this.spec.serviceName) ||
      this.hasPodsSelectedBy({ matchLabels: service.spec?.selector });
  }

  /**
   * Does the HorizontalPodAutoscaler scale this workload?
   *
   * @param {Object} autoscaler
   * @returns {boolean}
   */
  isScaleTargetOf(autoscaler) {
    const target = autoscaler?.spec?.scaleTargetRef;

    return autoscaler?.metadata?.namespace === this.metadata?.namespace &&
      target?.kind === this.kind &&
      target?.name === this.metadata?.name &&
      apiGroupOf(target?.apiVersion) === apiGroupOf(this.apiVersion);
  }

  /**
   * The resources related to this workload, or pod, to edit by YAML alongside it
   *
   * Dependencies, named by the pod template:
   * - PersistentVolumeClaims mounted, created from a StatefulSet's `volumeClaimTemplates`, or
   *   created for a pod's generic ephemeral volumes
   * - ConfigMaps, Secrets and the ServiceAccount
   *
   * Dependents:
   * - Services sending traffic to the pods, see `isSelectedByService`
   * - HorizontalPodAutoscalers scaling the workload
   * - PodDisruptionBudgets and NetworkPolicies selecting the pods
   *
   * Types the user can not access are skipped, as are named resources that do not exist
   *
   * @param {import('@shell/core/types').EditableRelatedResourcesFetchOptions} [options]
   * @returns {Promise<import('@shell/core/types').EditableRelatedResource[]>}
   */
  async fetchOwnEditableRelatedResources({ dependencies = true, dependents = true } = {}) {
    // a workload not yet created has no pods, so nothing is related to it yet
    if (!this.metadata?.uid) {
      return [];
    }

    const [uses, usedBy] = await Promise.all([
      dependencies ? this.fetchEditableDependencies() : [],
      dependents ? this.fetchEditableDependents() : [],
    ]);

    return [...uses, ...usedBy];
  }

  async fetchEditableDependencies() {
    const namespace = this.metadata.namespace;
    const workload = this.nameDisplay;
    const { names, fromEnv } = this.podReferences;
    const findNamed = (type, nameList) => Promise.all(nameList.map((name) => findIfExists(this, type, `${ namespace }/${ name }`)));

    const [claims, namespaceClaims, configMaps, secrets, serviceAccounts] = await Promise.all([
      findNamed(PVC, [...names[PVC], ...this.ephemeralClaimNames]),
      this.claimTemplates.length ? findAllOf(this, PVC, namespace) : [],
      findNamed(CONFIG_MAP, [...names[CONFIG_MAP]]),
      findNamed(SECRET, [...names[SECRET]]),
      findNamed(SERVICE_ACCOUNT, [...names[SERVICE_ACCOUNT]]),
    ]);

    const claimEntry = (claim) => {
      const template = this.claimTemplateFor(claim.metadata?.name)?.metadata?.name;

      return relatedEntry(claim, { banner: template ? () => ({ label: this.t('resourceYaml.resourceGraph.banners.claimFromTemplate', { workload, template }) }) : undefined });
    };

    const environmentEntry = (type) => (resource) => relatedEntry(resource, { banner: fromEnv[type].has(resource.metadata?.name) ? () => ({ label: this.t('resourceYaml.resourceGraph.banners.environmentSource', { workload, type: resource.typeDisplay }) }) : undefined });

    return [
      ...claims.filter(Boolean).map(claimEntry),
      ...namespaceClaims.filter((claim) => !names[PVC].has(claim.metadata?.name) && !!this.claimTemplateFor(claim.metadata?.name)).map(claimEntry),
      ...configMaps.filter(Boolean).map(environmentEntry(CONFIG_MAP)),
      ...secrets.filter(Boolean).map(environmentEntry(SECRET)),
      ...serviceAccounts.filter(Boolean).map((resource) => relatedEntry(resource)),
    ];
  }

  async fetchEditableDependents() {
    const namespace = this.metadata.namespace;
    const workload = this.nameDisplay;

    const [services, autoscalers, disruptionBudgets, networkPolicies] = await Promise.all([
      findAllOf(this, SERVICE, namespace),
      this.type === POD ? [] : findAllOf(this, HPA, namespace),
      findAllOf(this, POD_DISRUPTION_BUDGET, namespace),
      findAllOf(this, NETWORK_POLICY, namespace),
    ]);

    const serviceEntry = (service) => relatedEntry(service, {
      dependent: true,
      banner:    this.isServiceFromContainerPorts(service) ? () => ({ color: 'warning', label: this.t('resourceYaml.resourceGraph.banners.serviceFromContainerPorts', { workload }) }) : undefined,
    });

    const autoscalerEntry = (autoscaler) => relatedEntry(autoscaler, {
      dependent: true,
      banner:    () => ({ color: 'warning', label: this.t('resourceYaml.resourceGraph.banners.autoscaler', { workload }) }),
    });

    return [
      ...services.filter((service) => this.isSelectedByService(service)).map(serviceEntry),
      ...autoscalers.filter((autoscaler) => this.isScaleTargetOf(autoscaler)).map(autoscalerEntry),
      ...disruptionBudgets.filter((budget) => this.hasPodsSelectedBy(budget.spec?.selector)).map((resource) => relatedEntry(resource, { dependent: true })),
      ...networkPolicies.filter((policy) => this.hasPodsSelectedBy(policy.spec?.podSelector)).map((resource) => relatedEntry(resource, { dependent: true })),
    ];
  }

  async getPortsWithServiceType() {
    const ports = [];

    this.containers.forEach((container) => ports.push(...(container.ports || [])));
    (this.initContainers || []).forEach((container) => ports.push(...(container.ports || [])));

    // Only get services owned if we can access the service resource
    const canAccessServices = this.$getters['schemaFor'](SERVICE);
    const services = canAccessServices ? await this.getServicesOwned() : [];
    const clusterIPServicePorts = [];
    const loadBalancerServicePorts = [];
    const nodePortServicePorts = [];

    if (services.length) {
      services.forEach((svc) => {
        switch (svc.spec.type) {
        case 'ClusterIP':
          clusterIPServicePorts.push(...(svc?.spec?.ports || []));
          break;
        case 'LoadBalancer':
          loadBalancerServicePorts.push(...(svc?.spec?.ports || []));
          break;
        case 'NodePort':
          nodePortServicePorts.push(...(svc?.spec?.ports || []));
          break;
        default:
          break;
        }
      });
    }
    ports.forEach((port) => {
      const name = port.name ? port.name : `${ port.containerPort }${ port.protocol.toLowerCase() }${ port.hostPort || port._listeningPort || '' }`;

      port.name = name;

      if (port._serviceType && port._serviceType !== '') {
        return;
      }

      if (loadBalancerServicePorts.length) {
        const portSpec = findBy(loadBalancerServicePorts, 'name', name);

        if (portSpec) {
          port._listeningPort = portSpec.port;

          port._serviceType = 'LoadBalancer';

          return;
        }
      } if (nodePortServicePorts.length) {
        const portSpec = findBy(nodePortServicePorts, 'name', name);

        if (portSpec) {
          port._listeningPort = portSpec.nodePort;

          port._serviceType = 'NodePort';

          return;
        }
      } if (clusterIPServicePorts.length) {
        if (findBy(clusterIPServicePorts, 'name', name)) {
          port._serviceType = 'ClusterIP';
        }
      }
    });

    return ports;
  }

  async getServicesOwned(force = false) {
    const allSvc = await this.$dispatch('cluster/findAll', { type: SERVICE, opt: { force } }, { root: true });

    return (allSvc || []).filter((svc) => this.isServiceFromContainerPorts(svc));
  }

  /**
   * Was `service` created from the container ports of this workload, by `servicesFromContainerPorts`?
   *
   * Matched on the selector those services are given, in either its steve or norman form
   *
   * @param {Object} service
   * @returns {boolean}
   */
  isServiceFromContainerPorts(service) {
    const normanTypes = {
      [WORKLOAD_TYPES.REPLICA_SET]:  'replicaSet',
      [WORKLOAD_TYPES.DEPLOYMENT]:   'deployment',
      [WORKLOAD_TYPES.STATEFUL_SET]: 'statefulSet',
      [WORKLOAD_TYPES.DAEMON_SET]:   'daemonSet',
    };
    const selectorKey = Object.keys(this.workloadSelector)[0];

    const normanSelectorValue =
      `${ normanTypes[this._type ? this._type : this.type] }-${
        this.metadata.namespace
      }-${ this.metadata.name }`;

    const steveSelectorValue = this.workloadSelector[selectorKey];
    const value = (service?.spec?.selector || {})[selectorKey];

    return value === steveSelectorValue || value === normanSelectorValue;
  }

  get imageNames() {
    let containers;
    const images = [];

    if (this.type === WORKLOAD_TYPES.CRON_JOB) {
      containers = get(this, 'spec.jobTemplate.spec.template.spec.containers');
    } else {
      containers = get(this, 'spec.template.spec.containers');
    }
    if (containers) {
      containers.forEach((container) => {
        if (!images.includes(container.image)) {
          images.push(container.image);
        }
      });
    }

    return images.map(shortenedImage);
  }

  get containers() {
    if (this.type === WORKLOAD_TYPES.CRON_JOB) {
      // cronjob pod template is nested slightly different than other types
      const { spec: { jobTemplate: { spec: { template: { spec: { containers } } } } } } = this;

      return containers;
    }

    // A standalone Pod stores containers natively (spec.containers); workloads
    // nest them under spec.template.spec. Optional chaining keeps a native Pod
    // that has no `template` from blowing up.
    return this.spec?.containers ?? this.spec?.template?.spec?.containers;
  }

  get initContainers() {
    if (this.type === WORKLOAD_TYPES.CRON_JOB) {
      // cronjob pod template is nested slightly different than other types
      const { spec: { jobTemplate: { spec: { template: { spec: { initContainers } } } } } } = this;

      return initContainers;
    }

    // See `containers` above - a native Pod has no spec.template to fall back to.
    return this.spec?.initContainers ?? this.spec?.template?.spec?.initContainers;
  }

  get workloadSelector() {
    return {
      'workload.user.cattle.io/workloadselector': `${ this._type ? this._type : this.type }-${
        this.metadata.namespace
      }-${ this.metadata.name }`
    };
  }

  // create clusterip, nodeport, loadbalancer services from container port spec
  async servicesFromContainerPorts(mode, ports) {
    const ownerRef = {
      apiVersion: this.apiVersion,
      controller: true,
      kind:       this.kind,
      name:       this.metadata.name,
      uid:        this.metadata.uid
    };

    const annotations = { [TARGET_WORKLOADS]: JSON.stringify([`${ this.metadata.namespace }/${ this.metadata.name }`]), [UI_MANAGED]: 'true' };

    let clusterIP = {
      type: SERVICE,
      spec: {
        ports:    [],
        selector: this.workloadSelector,
        type:     'ClusterIP'
      },
      metadata: {
        name:            this.metadata.name,
        namespace:       this.metadata.namespace,
        annotations,
        ownerReferences: [ownerRef]
      },
    };

    let nodePort = {
      type: SERVICE,
      spec: {
        ports:    [],
        selector: this.workloadSelector,
        type:     'NodePort'
      },
      metadata: {
        name:            `${ this.metadata.name }-nodeport`,
        namespace:       this.metadata.namespace,
        annotations,
        ownerReferences: [ownerRef]
      },
    };

    let loadBalancer = {
      type: SERVICE,
      spec: {
        ports:                 [],
        selector:              this.workloadSelector,
        type:                  'LoadBalancer',
        externalTrafficPolicy: 'Cluster'
      },
      metadata: {
        name:            `${ this.metadata.name }-loadbalancer`,
        namespace:       this.metadata.namespace,
        annotations,
        ownerReferences: [ownerRef]
      },
    };

    const existing = await this.getServicesOwned(this.isFromNorman);

    if (existing && existing.length) {
      existing.forEach((service) => {
        switch (service.spec.type) {
        case 'ClusterIP':
          clusterIP = service;
          clusterIP.spec.ports = [];
          break;
        case 'NodePort':
          nodePort = service;
          nodePort.spec.ports = [];
          break;
        case 'LoadBalancer':
          loadBalancer = service;
          loadBalancer.spec.ports = [];
          break;
        default:
          break;
        }
      });
    }
    ports.forEach((port) => {
      const portSpec = {
        name: port.name, protocol: port.protocol, port: port.containerPort, targetPort: port.containerPort
      };

      if (port._serviceType !== '') {
        clusterIP.spec.ports.push(portSpec);
        switch (port._serviceType) {
        case 'NodePort': {
          const npPort = clone(portSpec);

          if (port._listeningPort) {
            npPort.nodePort = port._listeningPort;
          }
          nodePort.spec.ports.push(npPort);
          break; }
        case 'LoadBalancer': {
          const lbPort = clone(portSpec);

          if (port._listeningPort) {
            lbPort.port = port._listeningPort;
          }
          loadBalancer.spec.ports.push(lbPort);
          break; }
        default:
          break;
        }
      }
    });

    const toSave = [];
    const toRemove = [];
    let clusterIPProxy;

    if (clusterIP.spec.ports.length > 0) {
      if (clusterIP.id) {
        clusterIPProxy = clusterIP;
      } else {
        clusterIPProxy = await this.$dispatch(`cluster/create`, clusterIP, { root: true });
      }
      toSave.push(clusterIPProxy);
    } else if (clusterIP.id) {
      toRemove.push(clusterIP);
    }

    if (nodePort.spec.ports.length > 0) {
      let nodePortProxy;

      // if id is defined it's a preexisting service
      if (nodePort.id) {
        nodePortProxy = nodePort;
      } else {
        nodePortProxy = await this.$dispatch(`cluster/create`, nodePort, { root: true });
      }
      toSave.push(nodePortProxy);
      // if id defined but no ports, the service already exists but should be removed (user has removed all container ports mapping to it)
    } else if (nodePort.id) {
      toRemove.push(nodePort);
    }

    if (loadBalancer.spec.ports.length > 0) {
      let loadBalancerProxy;

      if (loadBalancer.id) {
        loadBalancerProxy = loadBalancer;
      } else {
        loadBalancerProxy = await this.$dispatch(`cluster/create`, loadBalancer, { root: true });
      }

      const portsWithIpam = ports.filter((p) => p._ipam) || [];

      if (portsWithIpam.length > 0) {
        loadBalancerProxy.metadata.annotations[HCI_LABELS_ANNOTATIONS.CLOUD_PROVIDER_IPAM] = portsWithIpam[0]._ipam;
      }

      toSave.push(loadBalancerProxy);
    } else if (loadBalancer.id) {
      toRemove.push(loadBalancer);
    }

    return { toSave, toRemove };
  }

  cleanForSave(data) {
    const val = super.cleanForSave(data);

    delete val.__active;
    delete val.type;

    return val;
  }

  cleanContainerForSave(container) {
    delete container.__active;
    delete container.active;
    delete container._init;
    delete container.error;

    return container;
  }
}
