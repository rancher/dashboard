import { WORKLOAD_TYPES } from '@/config/types';

export default {
  // remove clone as yaml/edit as yaml until API supported
  _availableActions() {
    let out = this._standardActions;

    const toFilter = ['cloneYaml'];

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    }).map((action) => {
      if (action.action === 'viewEditYaml') {
        action.label = 'View as YAML';
      }

      return action;
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
};
