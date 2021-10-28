import { EPINIO_TYPES } from '@/products/epinio/types';
import { createEpinioRoute } from '@/products/epinio/utils/custom-routing';
import EpinioResource from './epinio-resource-instance.class';

// POST - {"name":"my-service","data":{"foo":"bar"}}
// GET - { "boundapps": null, "name": "my-service" }

export default class EpinioService extends EpinioResource {
  namespace = 'workspace'; // FIXME: Remove once #943 resolved

  get links() {
    return {
      update: this.getUrl(),
      self:   this.getUrl(),
      remove: this.getUrl(),
      create: this.getUrl(this.meta?.namespace, null), // ensure name is null
    };
  }

  getUrl(namespace = this.meta?.namespace, name = this.meta?.name) {
    // Add baseUrl in a generic way
    return this.$getters['urlFor'](this.type, this.id, { url: `api/v1/namespaces/${ namespace }/services/${ name || '' }` });
  }

  // ------------------------------------------------------------------
  // Methods here are required for generic components to handle `namespaced` concept

  set metadata(metadata) {
    this.meta = {
      namespace: metadata.namespace,
      name:      metadata.name,
    };
  }

  get metadata() {
    return this.meta || {
      namespace: this.namespace, // FIXME: Remove once #943 resolved
      name:      this.name // FIXME: Remove once #943 resolved
    };
  }

  get namespaceLocation() {
    return createEpinioRoute(`c-cluster-resource-id`, {
      cluster:   this.$rootGetters['clusterId'],
      resource:  EPINIO_TYPES.NAMESPACE,
      id:       this.meta.namespace,
    });
  }

  // ------------------------------------------------------------------
}
