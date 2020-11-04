import { insertAt } from '@/utils/array';
import { TIMESTAMP } from '@/config/labels-annotations';
import { WORKLOAD_TYPES, POD } from '@/config/types';
import { get } from '@/utils/object';

export default {
  // remove clone as yaml/edit as yaml until API supported
  _availableActions() {
    let out = this._standardActions;

    insertAt(out, 0, {
      action:     'redeploy',
      label:      'Redeploy',
      icon:       'icon icon-spinner',
      enabled:    !!this.links.update,
    });

    const toFilter = ['cloneYaml'];

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    return out;
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
    let out;
    const type = this._type ? this._type : this.type;

    switch (type) {
    case WORKLOAD_TYPES.DEPLOYMENT:
      out = [
        {
          label:   'Type',
          content:  this._type ? this._type : this.type
        },
        {
          label:   'Replicas',
          content:  this?.spec?.replicas
        },
        {
          label:    'Available',
          content:  this?.status?.availableReplicas,
        },
        {
          label:    'Unavailable',
          content:  this?.status?.unavailableReplicas,

        },
        {
          label:    'Ready',
          content:  this?.status?.readyReplicas,

        },
        {
          label:    'Updated',
          content:  this?.status?.updatedReplicas,

        },
      ];
      break;
    case WORKLOAD_TYPES.STATEFUL_SET:
      out = [
        {
          label:   'Type',
          content:  this._type ? this._type : this.type
        },
        {
          label:   'Replicas',
          content:  this?.spec?.replicas
        },
        {
          label:   'Services',
          content:  this?.spec?.serviceName
        },
      ];
      break;
    case WORKLOAD_TYPES.DAEMON_SET:
      out = [
        {
          label:   'Type',
          content:  this._type ? this._type : this.type
        },
        {
          label:   'Number',
          content:  this.status.currentNumberScheduled / this.status.desiredNumberScheduled
        },
        {
          label:   'Available',
          content:  this.status.numberAvailable
        },
        {
          label:   'Unavailable',
          content:  this.status.numberUnavailable
        },
        {
          label:   'Ready',
          content:  this.status.numberReady
        },
        {
          label:   'Misscheduled',
          content:  this.status.numberMisscheduled
        },
        {
          label:   'Updated',
          content:  this.status.numberUpdated
        },
      ];
      break;
    case WORKLOAD_TYPES.REPLICA_SET:
      out = [
        {
          label:   'Type',
          content:  this._type ? this._type : this.type
        },
        {
          label:    'Available',
          content:  this?.status?.availableReplicas,
        },
        {
          label:    'Fully Labeled',
          content:  this?.status?.fullyLabeledReplicas,
        },
      ];
      break;
    case WORKLOAD_TYPES.JOB:
      out = [
        {
          label:   'Type',
          content:  this._type ? this._type : this.type
        },
        {
          label:    'Succeeded',
          content:  this?.status?.succeeded,
        },
        {
          label:    'Failed',
          content:  this?.status?.failed,
        },
        {
          label:     'Start Time',
          content:   this?.status?.startTime,
          formatter: 'LiveDate'
        },
        {
          label:     'Completion Time',
          content:   this?.status?.completionTime,
          formatter: 'LiveDate'
        },
      ];
      break;
    case WORKLOAD_TYPES.CRON_JOB:
      out = [
        {
          label:   'Type',
          content:  this._type ? this._type : this.type
        },
        {
          label:     'Last Scheduled Time',
          content:   this?.status?.lastScheduleTime,
          formatter: 'LiveDate'
        },
      ];
      break;
    default:
      out = [
        {
          label:   'Image',
          content: this.container.image
        },
        {
          label:   'Type',
          content:  this._type ? this._type : this.type
        },
        {
          label:    'Config Scale',
          content:  this.spec?.replicas,

        },
        {
          label:    'Ready Scale',
          content:  this.status?.readyReplicas,
        },
        /**
         * TODO: Pod Restarts will require more changes to get working but since workloads is being rewritten those
         * changes can be done at that time if this is still needed.
         * {
         *   label:    'Pod Restarts',
         *   content:  this.podRestarts,
         * }
         */
      ];
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
      'workload.user.cattle.io/workloadselector': `${ 'deployment' }-${
        this.metadata.namespace
      }-${ this.metadata.name }`
    };
  },
};
