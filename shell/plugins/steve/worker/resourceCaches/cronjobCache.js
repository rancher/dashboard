import WorkloadTypeCache from './workloadTypeCache';
import { WORKLOAD_TYPES } from '@shell/config/types';

export default class CronJobCache extends WorkloadTypeCache {
  constructor(schema, opt, workerMethods) {
    super(schema, opt, workerMethods);
    this.relatedTypes.push(WORKLOAD_TYPES.JOB);

    this._extraFields = [ // these are all fields that'll need to be deleted prior to sending back to the UI thread
      ...this._extraFields,
      {
        state: (cronjob) => {
          if ( cronjob.spec?.suspend ) {
            return 'suspended';
          }

          return this._extraFields.state(cronjob);
        }
      },
      {
        jobs: (cronjob) => {
          const jobRelationships = (cronjob.metadata?.relationships || [])
            .filter(relationship => relationship.toType === WORKLOAD_TYPES.JOB);

          return jobRelationships
            .map((relationship) => {
              return this._relatedTypeCaches[WORKLOAD_TYPES.JOB]
                .find(job => relationship.toId === job.id);
            }).filter(job => !!job);
        }
      }
    ];
  }
}
