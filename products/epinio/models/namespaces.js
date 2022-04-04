import EpinioResource from './epinio-resource';

export default class EpinioNamespace extends EpinioResource {
  get links() {
    return {
      self:   this.getUrl(),
      remove: this.getUrl(),
    };
  }

  async save() {
    await this._save(...arguments);
    const namespaces = await this.$dispatch('findAll', { type: this.type, opt: { force: true } });

    // Find new namespace
    // return new namespace
    return namespaces.filter(n => n.name === this.name)?.[0];
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

  get appCount() {
    return this.apps?.length || 0;
  }

  get configCount() {
    return this.configurations?.length || 0;
  }

  // ------------------------------------------------------------------

  getUrl() {
    // Add baseUrl in a generic way
    return this.$getters['urlFor'](this.type, this.id, { url: `/api/v1/namespaces/${ this.name }` });
  }

  // ------------------------------------------------------------------

  confirmRemove() {
    return true;
  }

  get warnDeletionMessage() {
    return this.t('epinio.namespace.deleteWarning');
  }

  get metadata() {
    return { name: this.name };
  }
}
