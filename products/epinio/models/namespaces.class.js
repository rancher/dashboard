// import axios from '@nuxtjs/axios';
import EpinioResource from './epinio-resource-instance.class';

export default class EpinioNamespaces extends EpinioResource {
  get id() {
    return this.__clone ? undefined : `${ this.name }`;
<<<<<<< HEAD
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
    // TODO: RC Tidy up
    // Add baseUrl in a generic way
    return this.$getters['urlFor'](this.type, this.id, { url: `api/v1/namespaces/${ this.name }` });
  }

  // ------------------------------------------------------------------
  customValidationRules() {
    return [
      {
        path:       'metadata.name',
        validators: [`namespaceName`]
      }
    ];
  }

  confirmRemove() {
    return true;
  }

  get _availableActions() {
    return [
      {
        action:     'promptRemove',
        altAction:  'remove',
        label:      this.t('action.remove'),
        icon:       'icon icon-trash',
        bulkable:   true,
        enabled:    true,
        bulkAction: 'promptRemove',
        weight:     -10, // Delete always goes last
      },
      ...this._standardActions
    ];
=======
>>>>>>> Namespace fixes
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
    // TODO: RC Tidy up
    // Add baseUrl in a generic way
    return this.$getters['urlFor'](this.type, this.id, { url: `api/v1/namespaces/${ this.name }` });
  }

  // ------------------------------------------------------------------
  customValidationRules() {
    return [
      {
        path:       'metadata.name',
        validators: [`namespaceName`]
      }
    ];
  }

  confirmRemove() {
    return true;
  }
}
