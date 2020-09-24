import { insertAt } from '@/utils/array';
import { TIMESTAMP } from '@/config/labels-annotations';
import { WORKLOAD_TYPES } from '@/config/types';

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

    return out;
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
