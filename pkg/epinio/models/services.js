import { createEpinioRoute } from '@pkg/utils/custom-routing';
import { EPINIO_TYPES } from '../types';
import EpinioNamespacedResource from './epinio-namespaced-resource';

export default class EpinioServiceModel extends EpinioNamespacedResource {
  get links() {
    return {
      update: this.getUrl(),
      self:   this.getUrl(),
      remove: this.getUrl(),
      bind:   `${ this.getUrl() }/bind`,
      unbind: `${ this.getUrl() }/unbind`,
      create: this.getUrl(this.metadata?.namespace, null) // ensure name is null
    };
  }

  getUrl(namespace = this.metadata?.namespace, name = this.metadata?.name) {
    // getUrl(namespace = this.meta?.namespace, name = this.meta?.name) {
    // Add baseUrl in a generic way
    return this.$getters['urlFor'](this.type, this.id, { url: `/api/v1/namespaces/${ namespace }/services/${ name || '' }` });
  }

  // ------------------------------------------------------------------

  get applications() {
    // map bound app names to app models
    return (this.boundapps || [])
      .map((ba) => {
        return (this.$getters['all'](EPINIO_TYPES.APP) || []).find(
          a => a.meta.namespace === this.meta.namespace && a.meta.name === ba
        );
      })
      .filter(a => !!a);
  }

  // ------------------------------------------------------------------

  get state() {
    return this.status;
  }

  get serviceLocation() {
    return createEpinioRoute(`c-cluster-resource-id`, {
      cluster:  this.$rootGetters['clusterId'],
      resource: EPINIO_TYPES.CATALOG_SERVICE,
      id:       this.catalog_service
    });
  }

  async create() {
    await this.followLink('create', {
      method:  'post',
      headers: {
        'content-type': 'application/json',
        accept:         'application/json'
      },
      data: {
        name:            this.name,
        catalog_service: this.catalog_service
      }
    });
  }

  async bindApp(appName) {
    await this.followLink('bind', {
      method:  'post',
      headers: {
        'content-type': 'application/json',
        accept:         'application/json'
      },
      data: { app_name: appName }
    });
  }

  async unbindApp(appName) {
    await this.followLink('unbind', {
      method:  'post',
      headers: {
        'content-type': 'application/json',
        accept:         'application/json'
      },
      data: { app_name: appName }
    });
  }

  async delete(unbind = true) {
    await this._remove({ data: { unbind } });
  }

  async remove() {
    await this.delete(true);
  }
}
