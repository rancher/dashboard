import EpinioMetaResource from './epinio-namespaced-resource';

export default class EpinioCatalogServiceModel extends EpinioMetaResource {
  get links() {
    return {
      update:      this.getUrl(),
      self:        this.getUrl(),
      remove:      this.getUrl(),
      create:      this.getUrl(null), // ensure name is null
    };
  }

  getUrl(name = this.meta?.name) {
    // Add baseUrl in a generic way
    return this.$getters['urlFor'](this.type, this.id, { url: `/api/v1/catalogservices/${ name || '' }` });
  }
}
