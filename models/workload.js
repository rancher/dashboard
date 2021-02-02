import { insertAt } from '@/utils/array';
import { TARGET_WORKLOADS, TIMESTAMP, UI_MANAGED } from '@/config/labels-annotations';
import { WORKLOAD_TYPES, POD, ENDPOINTS, SERVICE } from '@/config/types';
import { get, set } from '@/utils/object';
import day from 'dayjs';
import { _CREATE } from '@/config/query-params';

export default {
  // remove clone as yaml/edit as yaml until API supported
  _availableActions() {
    let out = this._standardActions;
    const type = this._type ? this._type : this.type;

    if (type !== WORKLOAD_TYPES.JOB) {
      insertAt(out, 0, {
        action:     'redeploy',
        label:      'Redeploy',
        icon:       'icon icon-spinner',
        enabled:    !!this.links.update,
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
      const spec = {};

      if (this.type === WORKLOAD_TYPES.CRON_JOB) {
        if (!spec.jobTemplate) {
          spec.jobTemplate = { spec: { template: { spec: { restartPolicy: 'Never' } } } };
        }
      } else {
        if (!spec.replicas && spec.replicas !== 0) {
          spec.replicas = 1;
        }

        if (!spec.template) {
          spec.template = { spec: { restartPolicy: this.type === WORKLOAD_TYPES.JOB ? 'Never' : 'Always' } };
        }
        if (!spec.selector) {
          spec.selector = {};
        }
      }
      vm.$set(this, 'spec', spec);
    };
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

  container() {
    if (this.type === WORKLOAD_TYPES.CRON_JOB) {
      // cronjob pod template is nested slightly different than other types
      const { spec: { jobTemplate: { spec: { template: { spec: { containers } } } } } } = this;

      return containers[0];
    }
    const { spec:{ template:{ spec:{ containers } } } } = this;

    return containers[0];
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

  pods() {
    const { metadata:{ relationships = [] } } = this;

    return async() => {
      if (this.type === WORKLOAD_TYPES.CRON_JOB) {
        const jobRelationships = relationships.filter(relationship => relationship.toType === WORKLOAD_TYPES.JOB);

        if (jobRelationships) {
          const jobs = await Promise.all(jobRelationships.map((relationship) => {
            return this.$dispatch('cluster/find', { type: WORKLOAD_TYPES.JOB, id: relationship.toId }, { root: true });
          }));

          const jobPods = await Promise.all(jobs.map((job) => {
            return job.pods();
          }));

          return jobPods.reduce((all, each) => {
            all.push(...each);

            return all;
          }, []);
        }
      }
      const podRelationship = relationships.filter(relationship => relationship.toType === POD)[0];
      let pods;

      if (podRelationship) {
        pods = await this.$dispatch('cluster/findMatching', { type: POD, selector: podRelationship.selector }, { root: true });
      }

      return pods.filter(pod => pod.metadata.namespace === this.metadata.namespace);
    };
  },

  getServicesOwned() {
    return async() => {
      const { metadata:{ relationships = [] } } = this;
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

    return images.map((x = '') => x.replace(/^docker.io\/(library\/)?/, '').replace(/:latest$/, '') );
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

  endpoints() {
    const endpoints = this.$rootGetters['cluster/byId'](ENDPOINTS, this.id);

    if (endpoints) {
      const out = endpoints.metadata.fields[1];

      return out;
    }
  },

  // 30422

  // create clusterip, nodeport, loadbalancer services from container port spec
  servicesFromContainerPorts() {
    return async(mode) => {
      const workloadErrors = await this.validationErrors(this);

      if (workloadErrors.length ) {
        throw workloadErrors;
      }

      const { ports = [] } = this.container;

      let clusterIP = {
        type: SERVICE,
        spec: {
          ports:    [],
          selector: this.workloadSelector,
          type:     'ClusterIP'
        },
        metadata: {
          name:        this.metadata.name,
          namespace:   this.metadata.namespace,
          annotations:    { [TARGET_WORKLOADS]: `['${ this.metadata.namespace }/${ this.metadata.name }']`, [UI_MANAGED]: 'true' },
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
          name:        `${ this.metadata.name }-nodeport`,
          namespace:   this.metadata.namespace,
          annotations:    { [TARGET_WORKLOADS]: `['${ this.metadata.namespace }/${ this.metadata.name }']`, [UI_MANAGED]: 'true' },

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
          name:        `${ this.metadata.name }-loadbalancer`,
          namespace:   this.metadata.namespace,
          annotations:    { [TARGET_WORKLOADS]: `['${ this.metadata.namespace }/${ this.metadata.name }']`, [UI_MANAGED]: 'true' },

        },
      };

      if (mode !== _CREATE) {
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
            }
          });
        }
      }

      ports.forEach((port) => {
        const name = port.name ? `${ port.name }` : `${ port.containerPort }${ port.protocol.toLowerCase() }${ port.hostPort || port._lbPort || '' }`;

        port.name = name;
        const portSpec = {
          name, protocol: port.protocol, port: port.containerPort, targetPort: port.containerPort
        };

        if (port._serviceType && port._serviceType !== '') {
          clusterIP.spec.ports.push(portSpec);

          switch (port._serviceType) {
          case 'NodePort':
            nodePort.spec.ports.push(portSpec);
            break;
          case 'LoadBalancer':
            portSpec.port = port._lbPort;
            loadBalancer.spec.ports.push(portSpec);
            break;
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
};
