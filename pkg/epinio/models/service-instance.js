import EpinioNamespacedResource from './epinio-namespaced-resource';

export default class EpinioServiceInstance extends EpinioNamespacedResource {
  get links() {
    return {
      update:      this.getUrl(),
      self:        this.getUrl(),
      remove:      this.getUrl(),
      create:      this.getUrl(this.meta?.namespace, null), // ensure name is null
    };
  }

  getUrl(namespace = 'from-ui', name = this.meta?.name) {
  // getUrl(namespace = this.meta?.namespace, name = this.meta?.name) {
    // Add baseUrl in a generic way
    return this.$getters['urlFor'](this.type, this.id, { url: `/api/v1/namespaces/${ namespace }/services/${ name || '' }` });
  }

  // ------------------------------------------------------------------

  set metadata(metadata) {
    this.name = metadata.name;
    this.namespace = metadata.namespace;
  }

  get metadata() {
    return { // TODO: See https://github.com/epinio/ui/issues/97#issuecomment-1124880156
      name:      this.name,
      namespace: this.namespace,
      state:     this.status
    };
  }
}
