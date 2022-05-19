import { createEpinioRoute } from '~/pkg/epinio/utils/custom-routing';
import EpinioResource from './epinio-resource';

export default class EpinioNamespacedResource extends EpinioResource {
  set metadata(metadata) {
    this.meta = {
      namespace: metadata.namespace,
      name:      metadata.name,
    };
  }

  get metadata() {
    return this.meta;
  }

  get namespaceLocation() {
    return createEpinioRoute(`c-cluster-resource-id`, {
      cluster:   this.$rootGetters['clusterId'],
      resource:  this.schema.id,
      id:       this.meta.namespace,
    });
  }
}
