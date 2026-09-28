import Workload from './workload';

export default class ReplicaSet extends Workload {
  get revisionNumber() {
    if (!this.ownedByWorkload) {
      return undefined;
    }

    return this.metadata.annotations['deployment.kubernetes.io/revision'];
  }

  get glance() {
    const glance = [...this._glance];
    // readyReplicas out of desired, like `kubectl get replicasets`
    const ready = this.status?.readyReplicas || 0;
    const total = this.desired;
    const hasEndpoints = this.publicEndpoints.length > 0;
    const rows = [
      {
        name:          'ready',
        label:         this.t('component.resource.detail.glance.ready'),
        formatter:     'ReadyIndicator',
        // A ReplicaSet scaled to zero, e.g. one left behind by a Deployment rollout, has nothing to be ready
        formatterOpts: {
          ready, total, status: total === 0 ? 'none' : undefined
        },
        content: `${ ready }/${ total }`
      },
      {
        name:          'podRestarts',
        label:         this.t('component.resource.detail.glance.podRestarts'),
        formatter:     'WorkloadPodRestarts',
        formatterOpts: { row: this },
      },
      {
        // Always shown, like the Pod IP of a pod, so every ReplicaSet card has the same rows
        // Matches the Endpoints column of the ReplicaSets list
        name:          'endpoints',
        label:         this.t('component.resource.detail.glance.endpoints'),
        formatter:     hasEndpoints ? 'Endpoints' : undefined,
        formatterOpts: { row: this, col: {} },
        content:       hasEndpoints ? this.endpoint : '—'
      },
    ];

    const ageIndex = glance.findIndex((item) => item.name === 'age');

    glance.splice(ageIndex > -1 ? ageIndex : glance.length, 0, ...rows);

    return glance;
  }
}
