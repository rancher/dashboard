import { createEpinioRoute } from '@/products/epinio/utils/custom-routing';
import { Resource } from '@/plugins/core-store/resource-class';

export default class EpinioResource extends Resource {
  get id() {
    // Epinio resources don't have id's... so default to name... use model specific override
    throw new Error('Not Implemented');
  }

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

  // ------------------------------------------------------------------

  get canClone() {
    return false;
  }

  get canYaml() {
    return false;
  }

  get canViewInApi() {
    return false;
  }
  // ------------------------------------------------------------------

  async remove(opt = {}) {
    if ( !opt.url ) {
      opt.url = (this.links || {})['self'];
    }

    opt.method = 'delete';

    const res = await this.$dispatch('request', { opt, type: this.type });

    console.log('### Resource Remove', this.type, this.id, res);// eslint-disable-line no-console

    this.$dispatch('remove', this);
    // if ( res?._status === 204 ) {
    //   // If there's no body, assume the resource was immediately deleted
    //   // and drop it from the store as if a remove event happened.
    //   await this.$dispatch('ws.resource.remove', { data: this });
    // }
  }
}
