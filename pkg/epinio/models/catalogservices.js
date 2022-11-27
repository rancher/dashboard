import { EPINIO_TYPES } from '@pkg/types';
import { createEpinioRoute } from '@pkg/utils/custom-routing';
import EpinioMetaResource from './epinio-namespaced-resource';
import { EPINIO_SERVICE_PARAM } from '../edit/services.vue';

export default class EpinioCatalogServiceModel extends EpinioMetaResource {
  get _availableActions() {
    return [{
      action:  'createService',
      label:   this.t('generic.create'),
      icon:    'icon icon-fw icon-chevron-up',
      enabled: true,
    }];
  }

  get links() {
    return {
      update: this.getUrl(),
      self:   this.getUrl(),
      remove: this.getUrl(),
      create: this.getUrl(null), // ensure name is null
    };
  }

  getUrl(name = this.meta?.name) {
    // Add baseUrl in a generic way
    return this.$getters['urlFor'](this.type, this.id, { url: `/api/v1/catalogservices/${ name || '' }` });
  }

  get details() {
    return [
      {
        label:   this.t('epinio.catalogService.detail.appVersion'),
        content: this.appVersion,
      }
    //   {
    //   label:   this.t('epinio.catalogService.detail.chartVersion'),
    //   content: this.chartVersion,
    // }, {
    //   label:         this.t('epinio.catalogService.detail.helmChart'),
    //   content:       this.helm_repo.name,
    //   formatter:     `Link`,
    //   formatterOpts: {
    //     urlKey:   'helm_repo.url',
    //     labelKey: 'helm_repo.name',
    //     row:      this,
    //   }
    // }
    ];
  }

  get services() {
    return this.$getters['all'](EPINIO_TYPES.SERVICE_INSTANCE)
      .filter((s) => {
        return s.catalog_service === this.name;
      });
  }

  createService() {
    const serviceCreateLocation = createEpinioRoute(`c-cluster-resource-create`, {
      cluster:  this.$rootGetters['clusterId'],
      resource: EPINIO_TYPES.SERVICE_INSTANCE,
    });

    return this.currentRouter().push({
      ...serviceCreateLocation,
      query: { [EPINIO_SERVICE_PARAM]: this.name }
    });
  }
}
