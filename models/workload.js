import { insertAt } from '@/utils/array';
import { TIMESTAMP } from '@/config/labels-annotations';
import { WORKLOAD_TYPES } from '@/config/types';
import { _VIEW } from '@/config/query-params';

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
    return [
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
  },

  redeploy() {
    const now = (new Date()).toISOString().replace(/\.\d+Z$/, 'Z');

    this.setAnnotation(TIMESTAMP, now);
    this.save();
  },

  // Hide resource detail masthead in create/edit/clone because it's redundant with the wizard
  showMasthead() {
    return (mode) => {
      if (mode !== _VIEW) {
        return false;
      } else {
        return true;
      }
    };
  }
};
