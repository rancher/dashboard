import Workload from './workload';
import { GATEWAY_API, SERVICE } from '@shell/config/types';

// What the Gateway API endpoints of a ReplicaSet are worked out from
const GATEWAY_ENDPOINT_TYPES = [SERVICE, GATEWAY_API.HTTP_ROUTE, GATEWAY_API.GATEWAY];

export default class ReplicaSet extends Workload {
  get revisionNumber() {
    if (!this.ownedByWorkload) {
      return undefined;
    }

    return this.metadata.annotations['deployment.kubernetes.io/revision'];
  }

  get readyReplicas() {
    return this.status?.readyReplicas || 0;
  }

  // readyReplicas out of desired, like `kubectl get replicasets`. A ReplicaSet doesn't report unavailableReplicas, which
  // Workload counts from, so every replica it created would show as ready
  get ready() {
    return `${ this.readyReplicas }/${ this.desired }`;
  }

  /**
   * The Gateway API endpoints once what they're worked out from is in the store, see `fetchGatewayEndpointResources`.
   * Before that the store would be asked for types it hasn't loaded
   */
  get glanceGatewayEndpoints() {
    const loaded = GATEWAY_ENDPOINT_TYPES.every((type) => this.$rootGetters['cluster/typeRegistered'](type));

    return loaded ? this.gatewayEndpoints : [];
  }

  // Without the Gateway API, or when the user can't see it, there are no gateway endpoints to show
  get hasGatewayApi() {
    return GATEWAY_ENDPOINT_TYPES.every((type) => this.$rootGetters['cluster/schemaFor'](type));
  }

  /**
   * Fetch what the card needs to show the Gateway API endpoints, like the workload detail page does
   */
  async fetchGatewayEndpointResources() {
    if (!this.hasGatewayApi) {
      return;
    }

    await Promise.all([
      this.$dispatch('cluster/findAll', { type: SERVICE, opt: { namespaced: this.metadata.namespace } }, { root: true }),
      this.$dispatch('cluster/findAll', { type: GATEWAY_API.HTTP_ROUTE }, { root: true }),
      this.$dispatch('cluster/findAll', { type: GATEWAY_API.GATEWAY }, { root: true }),
    ]);
  }

  get glance() {
    const glance = [...this._glance];
    const ready = this.readyReplicas;
    const total = this.desired;
    const hasPublicEndpoints = this.publicEndpoints.length > 0;
    const rows = [
      {
        name:          'ready',
        label:         this.t('component.resource.detail.glance.ready'),
        formatter:     'ReadyIndicator',
        // A ReplicaSet scaled to zero, e.g. one left behind by a Deployment rollout, has nothing to be ready
        formatterOpts: {
          ready, total, status: total === 0 ? 'none' : undefined
        },
        content: this.ready
      },
      {
        name:          'podRestarts',
        label:         this.t('component.resource.detail.glance.podRestarts'),
        formatter:     'WorkloadPodRestarts',
        formatterOpts: { row: this },
      },
      {
        // Always shown, like the Pod IP of a pod, so every ReplicaSet card has the same rows
        // The public endpoints match the Endpoints column of the ReplicaSets list, followed by the Gateway API endpoints
        // the workload detail page shows. Whether there are any of those is only known once the card has fetched them
        name:          'endpoints',
        label:         this.t('component.resource.detail.glance.endpoints'),
        formatter:     hasPublicEndpoints || this.hasGatewayApi ? 'WorkloadGlanceEndpoints' : undefined,
        formatterOpts: { row: this, col: {} },
        content:       hasPublicEndpoints ? this.endpoint : '—'
      },
    ];

    const ageIndex = glance.findIndex((item) => item.name === 'age');

    glance.splice(ageIndex > -1 ? ageIndex : glance.length, 0, ...rows);

    return glance;
  }
}
