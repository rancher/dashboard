
import { findBy } from '@shell/utils/array';
import { TARGET_WORKLOADS, UI_MANAGED, HCI as HCI_LABELS_ANNOTATIONS } from '@shell/config/labels-annotations';
import { WORKLOAD_TYPES, SERVICE } from '@shell/config/types';
import { clone, get } from '@shell/utils/object';
import SteveModel from '@shell/plugins/steve/steve-class';
import { shortenedImage } from '@shell/utils/string';

export default class WorkloadService extends SteveModel {
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
    const allSvc = await this.$dispatch('cluster/findAll', { type: SERVICE, opt: { force } }, { root: true });

    return (allSvc || []).filter((svc) => (svc.spec?.selector || {})[selectorKey] === steveSelectorValue || (svc.spec?.selector || {})[selectorKey] === normanSelectorValue );
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

    if ( this.spec.containers ) {
      return this.spec.containers;
    }

    const { spec:{ template:{ spec:{ containers } } } } = this;

    return containers;
  }

  get initContainers() {
    if (this.type === WORKLOAD_TYPES.CRON_JOB) {
      // cronjob pod template is nested slightly different than other types
      const { spec: { jobTemplate: { spec: { template: { spec: { initContainers } } } } } } = this;

      return initContainers;
    }

    if (this.spec.initContainers) {
      return this.spec.initContainers;
    }

    const { spec:{ template:{ spec:{ initContainers } } } } = this;

    return initContainers;
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
