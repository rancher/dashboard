import { WORKLOAD_TYPES } from '@shell/config/types';
import Workload from './workload';

export default class Deployment extends Workload {
  get replicaSetId() {
    const set = this.metadata?.relationships?.find((relationship) => {
      return relationship.rel === 'owner' &&
            relationship.toType === WORKLOAD_TYPES.REPLICA_SET;
    });

    return set?.toId?.replace(`${ this.namespace }/`, '');
  }
}
