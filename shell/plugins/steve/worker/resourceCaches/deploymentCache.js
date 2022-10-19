import WorkloadTypeCache from './workloadTypeCache';
import { WORKLOAD_TYPES } from '@shell/config/types';

export default class DeploymentCache extends WorkloadTypeCache {
  constructor(schema, opt, workerMethods) {
    super(schema, opt, workerMethods);

    this._extraFields = [ // these are all fields that'll need to be deleted prior to sending back to the UI thread
      ...this._extraFields,
      {
        replicaSetId: (deployment) => {
          const set = deployment.metadata?.relationships?.find((relationship) => {
            return relationship.rel === 'owner' &&
                relationship.toType === WORKLOAD_TYPES.REPLICA_SET;
          });

          return set?.toId?.replace(`${ deployment.namespace }/`, '');
        }
      }
    ];
  }
}
