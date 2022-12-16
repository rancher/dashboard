import EpinioMetaResource from '~/pkg/epinio/models/epinio-namespaced-resource';

export default class EpinioAppChartModel extends EpinioMetaResource {
  get links() {
    return {
      update: this.getUrl(),
      self:   this.getUrl(),
    };
  }

  getUrl(name = this.metadata?.name) {
    // Add baseUrl in a generic way
    return this.$getters['urlFor'](this.type, this.id, { url: `/api/v1/appcharts/${ name || '' }` });
  }
}
