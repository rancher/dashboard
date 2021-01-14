import { insertAt } from '@/utils/array';
import { TARGET_WORKLOADS, TIMESTAMP } from '@/config/labels-annotations';
import { WORKLOAD_TYPES, POD, ENDPOINTS, SERVICE } from '@/config/types';
import { get } from '@/utils/object';
import day from 'dayjs';

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

      return pods;
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

    this.setAnnotation(TIMESTAMP, now);
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

  // create clusterip and nodeport services from container port spec
  servicesFromContainerPorts() {
    return async() => {
      const workloadErrors = await this.validationErrors(this);

      if (workloadErrors.length ) {
        throw workloadErrors;
      }
      const clusterIP = {
        type: SERVICE,
        spec: {
          ports:    [],
          selector: this.workloadSelector,
          type:     'ClusterIP'
        },
        metadata: {
          name:        this.metadata.name,
          namespace:   this.metadata.namespace,
          annotations:    { [TARGET_WORKLOADS]: `['${ this.metadata.namespace }/${ this.metadata.name }']` },
        },
      };

      const nodePort = {
        type: SERVICE,
        spec: {
          ports:    [],
          selector: this.workloadSelector,
          type:     'NodePort'
        },
        metadata: {
          name:        `${ this.metadata.name }-nodeport`,
          namespace:   this.metadata.namespace,
          annotations:    { [TARGET_WORKLOADS]: `['${ this.metadata.namespace }/${ this.metadata.name }']` },

        },
      };

      const loadBalancer = {
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
          annotations:    { [TARGET_WORKLOADS]: `['${ this.metadata.namespace }/${ this.metadata.name }']` },

        },
      };

      const { ports = [] } = this.container;

      ports.forEach((port) => {
        const name = port.name ? `${ port.name }-${ this.metadata.name }` : `${ port.containerPort }${ port.protocol.toLowerCase() }${ port.hostPort || '' }`;

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

      if (clusterIP.spec.ports.length === 0) {
        return [];
      }

      const out = [];
      const clusterIPSvc = await this.$dispatch(`cluster/create`, clusterIP, { root: true });

      out.push(clusterIPSvc);
      if (nodePort.spec.ports.length > 0) {
        const nodePortSvc = await this.$dispatch(`cluster/create`, nodePort, { root: true });

        out.push(nodePortSvc);
      } if (loadBalancer.spec.ports.length > 0) {
        const loadBalancerSvc = await this.$dispatch(`cluster/create`, loadBalancer, { root: true });

        out.push(loadBalancerSvc);
      }

      return out;
    };
  },
};
