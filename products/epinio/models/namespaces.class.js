// import axios from '@nuxtjs/axios';
import EpinioResource from './epinio-resource-instance.class';

export default class EpinioNamespaces extends EpinioResource {
  get id() {
    return this.__clone ? undefined : `${ this.name }`;
  }

  get links() {
    return {
      self:   this.getUrl(),
      remove: this.getUrl(),
    };
  }

  async create() {
    await this.followLink('create', {
      method:  'post',
      headers: {
        'content-type': 'application/json',
        accept:         'application/json'
      },
      data: { name: this.name }
    });
  }

  async save() {
    await this._save(...arguments);
    await this.$dispatch('findAll', { type: this.type, opt: { force: true } });
    // Find new namespace
    // return new namespace
  }

  get canClone() {
    return false;
  }

  get canViewInApi() {
    return false;
  }

  get canCustomEdit() {
    return false;
  }

  // ------------------------------------------------------------------

  getUrl() {
    // TODO: RC Tidy up
    // Add baseUrl in a generic way
    return this.$getters['urlFor'](this.type, this.id, { url: `api/v1/namespaces/${ this.name }` });
  }

  // ------------------------------------------------------------------
}
