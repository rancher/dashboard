import { createEpinioRoute } from '@/products/epinio/utils/custom-routing';
import Resource from '@/plugins/core-store/resource-class';
import { epinioExceptionToErrorsArray } from '@/products/epinio/utils/errors';

export default class EpinioResource extends Resource {
  get id() {
    return this['dashboard-meta'].id;
  }

  get listLocation() {
    return this.$rootGetters['type-map/optionsFor'](this.type).customRoute || createEpinioRoute(`c-cluster-resource`, {
      cluster:   this.$rootGetters['clusterId'],
      resource:  this.type,
    });
  }

  get detailLocation() {
    const schema = this.$getters['schemaFor'](this.type);

    const id = this.id?.replace(/.*\//, '');

    return createEpinioRoute(`c-cluster-resource${ schema?.attributes?.namespaced ? '-namespace' : '' }-id`, {
      cluster:   this.$rootGetters['clusterId'],
      resource:  this.type,
      id,
      namespace: this.meta?.namespace,
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
  async _save(opt = {}) {
    try {
      return await super._save(opt);
    } catch (e) {
      throw epinioExceptionToErrorsArray(e);
    }
  }

  async remove(opt = {}) {
    if ( !opt.url ) {
      opt.url = (this.links || {})['self'];
    }

    opt.method = 'delete';

    try {
      const res = await this.$dispatch('request', { opt, type: this.type });

      console.log('### Resource Remove', this.type, this.id, res);// eslint-disable-line no-console
      this.$dispatch('remove', this);
    } catch (e) {
      throw epinioExceptionToErrorsArray(e);
    }

    // if ( res?._status === 204 ) {
    //   // If there's no body, assume the resource was immediately deleted
    //   // and drop it from the store as if a remove event happened.
    //   await this.$dispatch('ws.resource.remove', { data: this });
    // }
  }
}
