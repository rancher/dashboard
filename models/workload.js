import { insertAt } from '@/utils/array';
import { TIMESTAMP } from '@/config/labels-annotations';
import { WORKLOAD_TYPES, POD } from '@/config/types';
import { get } from '@/utils/object';
import day from 'dayjs';

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
    const out = [];
    const type = this._type ? this._type : this.type;

    if (type === WORKLOAD_TYPES.JOB) {
      const { completionTime, startTime } = this.status;
      const FACTORS = [60, 60, 24];
      const LABELS = ['sec', 'min', 'hour', 'day'];

      if ( startTime ) {
        out.push({
          label:     'Started',
          content:   startTime,
          formatter: 'LiveDate'
        });
      }

      if (completionTime && startTime) {
        const end = day(completionTime);
        const start = day(startTime);
        let diff = end.diff(start);

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
      'workload.user.cattle.io/workloadselector': `${ 'deployment' }-${
        this.metadata.namespace
      }-${ this.metadata.name }`
    };
  },
};
