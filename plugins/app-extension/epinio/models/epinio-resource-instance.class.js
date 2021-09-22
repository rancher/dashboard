import { createEpinioRoute } from '@/plugins/app-extension/epinio/utils/custom-routing';
import { Resource } from '@/plugins/core-store/resource-class';

export default class EpinioResource extends Resource {
  get listLocation() {
    return this.$rootGetters['type-map/optionsFor'](this.type).customRoute || createEpinioRoute(`c-cluster-resource`, {
      cluster:   this.$rootGetters['clusterId'],
      resource:  this.type,
    });
  }

  // TODO: RC DISCUSS tie in namespace selector with org
  // _detailLocation() {
  //   const schema = this.$getters['schemaFor'](this.type);

  //   const id = this.id?.replace(/.*\//, '');

  //   return {
  //     name:   `c-cluster-product-resource${ schema?.attributes?.namespaced ? '-namespace' : '' }-id`,
  //     params: {
  //       product:   this.$rootGetters['productId'],
  //       cluster:   this.$rootGetters['clusterId'],
  //       resource:  this.type,
  //       namespace: this.metadata?.namespace,
  //       id,
  //     }
  //   };
  // },

  get detailLocation() {
    return createEpinioRoute(`c-cluster-resource-id`, {
      cluster:   this.$rootGetters['clusterId'],
      resource:  this.type,
      id:       this.id
    });
  }
}
