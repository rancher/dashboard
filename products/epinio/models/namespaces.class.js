import EpinioResource from './epinio-resource-instance.class';

export default class EpinioNamespaces extends EpinioResource {
  get links() {
    return {
      self:   this.getUrl(),
      remove: this.getUrl(),
    };
  }

  async save() {
    await this._save(...arguments);
    const namespaces = await this.$dispatch('findAll', { type: this.type, opt: { force: true } });

    try {
      // Find new namespace
      // return new namespace
      const newNamespace = namespaces.filter(n => n.name === this.name)[0];

      return newNamespace;
    } catch (e) {
      throw new Error(e);
    }
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
    // Add baseUrl in a generic way
    return this.$getters['urlFor'](this.type, this.id, { url: `api/v1/namespaces/${ this.name }` });
  }

  // ------------------------------------------------------------------

  confirmRemove() {
    return true;
  }
}
