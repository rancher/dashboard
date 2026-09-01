import Workload from './workload';

export default class ReplicaSet extends Workload {
  get revisionNumber() {
    if (!this.ownedByWorkload) {
      return undefined;
    }

    return this.metadata.annotations['deployment.kubernetes.io/revision'];
  }
}
