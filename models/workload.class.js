import { findBy, insertAt } from '@/utils/array';
import { TARGET_WORKLOADS, TIMESTAMP, UI_MANAGED } from '@/config/labels-annotations';
import { WORKLOAD_TYPES, SERVICE } from '@/config/types';
import { clone, get, set } from '@/utils/object';
import day from 'dayjs';

export default {
  // remove clone as yaml/edit as yaml until API supported
  _availableActions() {
    let out = this._standardActions;
    const type = this._type ? this._type : this.type;

    insertAt(out, 0, {
      action: 'addSidecar',
      label:  'Add Sidecar',
      icon:   'icon icon-plus'
    });

    if (type !== WORKLOAD_TYPES.JOB && type !== WORKLOAD_TYPES.CRON_JOB) {
      insertAt(out, 0, {
        action:     'redeploy',
        label:      'Redeploy',
        icon:       'icon icon-spinner',
        enabled:    !!this.links.update,
        bulkable:   true,
      });
    }

    const toFilter = ['cloneYaml'];

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    return out;
  },

  applyDefaults() {
    return (vm, mode) => {
      const { spec = {} } = this;

      if (this.type === WORKLOAD_TYPES.CRON_JOB) {
        if (!spec.jobTemplate) {
          spec.jobTemplate = {
            spec: {
              template: {
                spec: {
                  restartPolicy: 'Never', containers: [{ imagePullPolicy: 'Always', name: 'container-0' }], initContainers: []
                }
              }
            }
          };
        }
      } else {
        if (!spec.replicas && spec.replicas !== 0) {
          spec.replicas = 1;
        }

        if (!spec.template) {
          spec.template = {
            spec: {
              restartPolicy: this.type === WORKLOAD_TYPES.JOB ? 'Never' : 'Always', containers: [{ imagePullPolicy: 'Always', name: 'container-0' }], initContainers: []
            }
          };
        }
        if (!spec.selector) {
          spec.selector = {};
        }
      }
      vm.$set(this, 'spec', spec);
    };
  },

  addSidecar() {
    return this.goToEdit({ sidecar: true });
  },

  hasSidecars() {
    const podTemplateSpec = this.type === WORKLOAD_TYPES.CRON_JOB ? this?.spec?.jobTemplate?.spec?.template?.spec : this.spec?.template?.spec;

    const { containers = [], initContainers = [] } = podTemplateSpec;

    return containers.length > 1 || initContainers.length;
  },

  customValidationRules() {
    const type = this._type ? this._type : this.type;

    const podSpecPath = type === WORKLOAD_TYPES.CRON_JOB ? 'spec.jobTemplate.spec.template.spec' : 'spec.template.spec';
    const out = [
      {
        nullable:       false,
        path:           'metadata.name',
        required:       true,
        translationKey: 'generic.name',
        type:           'dnsLabel',
      },
      {
        nullable:       false,
        path:           'spec',
        required:       true,
        type:           'object',
        validators:     ['containerImages'],
      },
      {
        nullable:       true,
        path:           `${ podSpecPath }.affinity`,
        type:           'object',
        validators:     ['podAffinity'],
      }
    ];

    switch (type) {
    case WORKLOAD_TYPES.DEPLOYMENT:
    case WORKLOAD_TYPES.REPLICA_SET:
      out.push( {
        nullable:       false,
        path:           'spec.replicas',
        required:       true,
        type:           'number',
        translationKey: 'workload.replicas'
      });
      break;
    case WORKLOAD_TYPES.STATEFUL_SET:
      out.push({
        nullable:       false,
        path:           'spec.replicas',
        required:       true,
        type:           'number',
        translationKey: 'workload.replicas'
      });
      out.push({
        nullable:       false,
        path:           'spec.serviceName',
        required:       true,
        type:           'string',
        translationKey: 'workload.serviceName'
      });
      break;
    case WORKLOAD_TYPES.CRON_JOB:
      out.push( {
        nullable:       false,
        path:           'spec.schedule',
        required:       true,
        type:           'string',
        validators:     ['cronSchedule'],
      });
    }

    return out;
  },

  containers() {
    if (this.type === WORKLOAD_TYPES.CRON_JOB) {
      // cronjob pod template is nested slightly different than other types
      const { spec: { jobTemplate: { spec: { template: { spec: { containers } } } } } } = this;

      return containers;
    }
    const { spec:{ template:{ spec:{ containers } } } } = this;

    return containers;
  },

  initContainers() {
    if (this.type === WORKLOAD_TYPES.CRON_JOB) {
      // cronjob pod template is nested slightly different than other types
      const { spec: { jobTemplate: { spec: { template: { spec: { initContainers } } } } } } = this;

      return initContainers;
    }
    const { spec:{ template:{ spec:{ initContainers } } } } = this;

    return initContainers;
  },

  details() {
    const out = [];
    const type = this._type ? this._type : this.type;

    if (type === WORKLOAD_TYPES.JOB) {
      const { completionTime, startTime } = this.status;
      const FACTORS = [60, 60, 24];
      const LABELS = ['sec', 'min', 'hour', 'day'];

      if ( startTime ) {
        out.push({
          label:         'Started',
          content:       startTime,
          formatter:     'LiveDate',
          formatterOpts: { addSuffix: true },
        });
      }

      if (completionTime && startTime) {
        const end = day(completionTime);
        const start = day(startTime);
        let diff = end.diff(start) / 1000;

        let label;

        let i = 0;

        while ( diff >= FACTORS[i] && i < FACTORS.length ) {
          diff /= FACTORS[i];
          i++;
        }

        if ( diff < 5 ) {
          label = Math.floor(diff * 10) / 10;
        } else {
          label = Math.floor(diff);
        }

        label += ` ${ this.t(`unit.${ LABELS[i] }`, { count: label }) } `;
        label = label.trim();

        out.push({ label: 'Duration', content: label });
      }
    } else if ( type === WORKLOAD_TYPES.CRON_JOB ) {
      out.push({
        label:     'Last Scheduled Time',
        content:   this?.status?.lastScheduleTime,
        formatter: 'LiveDate'
      });
    }

    out.push( {
      label:     'Image',
      content:   this.imageNames,
      formatter: 'PodImages'
    });

    return out;
  },

  getServicesOwned() {
    return async() => {
      const relationships = get(this, 'metadata.relationships') || [];
      const serviceRelationships = relationships.filter(relationship => relationship.toType === SERVICE && relationship.rel === 'owner');

      if (serviceRelationships.length) {
        const svcs = await Promise.all(serviceRelationships.map(rel => this.$dispatch('cluster/find', { type: SERVICE, id: rel.toId }, { root: true })));

        return svcs.filter(svc => svc?.metadata?.annotations[UI_MANAGED]);
      }

      return [];
    };
  },

  imageNames() {
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

    return images.map((x = '') => x.replace(/^(index\.)?docker.io\/(library\/)?/, '').replace(/:latest$/, '') );
  },

  redeploy() {
    const now = (new Date()).toISOString().replace(/\.\d+Z$/, 'Z');

    if ( !this.spec.template.metadata ) {
      set(this.spec.template, 'metadata', {});
    }

    const annotations = this.spec.template.metadata.annotations || {};

    annotations[TIMESTAMP] = now;
    set(this.spec.template.metadata, 'annotations', annotations);

    this.save();
  },

  workloadSelector() {
    return {
      'workload.user.cattle.io/workloadselector': `${ this._type ? this._type : this.type }-${
        this.metadata.namespace
      }-${ this.metadata.name }`
    };
  },

  // match existing container ports with services created for this workload
  getPortsWithServiceType() {
    return async() => {
      const ports = [];

      this.containers.forEach(container => ports.push(...(container.ports || [])));
      (this.initContainers || []).forEach(container => ports.push(...(container.ports || [])));

      const services = await this.getServicesOwned();
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
    };
  },

  // create clusterip, nodeport, loadbalancer services from container port spec
  servicesFromContainerPorts() {
    return async(mode, ports) => {
      if (!ports.length) {
        return;
      }

      const ownerRef = {
        apiVersion: this.apiVersion,
        controller: true,
        kind:       this.kind,
        name:       this.metadata.name,
        uid:        this.metadata.uid
      };

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
          annotations:     { [TARGET_WORKLOADS]: `['${ this.metadata.namespace }/${ this.metadata.name }']`, [UI_MANAGED]: 'true' },
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
          annotations:     { [TARGET_WORKLOADS]: `['${ this.metadata.namespace }/${ this.metadata.name }']`, [UI_MANAGED]: 'true' },
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
          annotations:     { [TARGET_WORKLOADS]: `['${ this.metadata.namespace }/${ this.metadata.name }']`, [UI_MANAGED]: 'true' },
          ownerReferences: [ownerRef]
        },
      };

      const existing = await this.getServicesOwned();

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
        toSave.push(loadBalancerProxy);
      } else if (loadBalancer.id) {
        toRemove.push(loadBalancer);
      }

      return { toSave, toRemove };
    };
  },

  showAsWorkload() {
    const types = Object.values(WORKLOAD_TYPES);

    if (this.metadata?.ownerReferences) {
      for (const owner of this.metadata.ownerReferences) {
        const have = (`${ owner.apiVersion.replace(/\/.*/, '') }.${ owner.kind }`).toLowerCase();

        if ( types.includes(have) ) {
          return false;
        }
      }
    }

    return true;
  },
};
