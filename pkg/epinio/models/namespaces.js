import { EPINIO_TYPES } from '~/pkg/epinio/types';
import EpinioMetaResource from './epinio-namespaced-resource';

export default class EpinioNamespace extends EpinioMetaResource {
  get links() {
    return {
      self:   this.getUrl(),
      remove: this.getUrl(),
      create: this.getUrl(null),
    };
  }

  async create() {
    await this.followLink('create', {
      method:  'post',
      headers: {
        'content-type': 'application/json',
        accept:         'application/json'
      },
      data: { name: this.meta.name }
    });

    const namespaces = await this.$dispatch('findAll', { type: this.type, opt: { force: true } });

    // Find new namespace
    return namespaces.filter(n => n.name === this.name)?.[0];
  }

  save() {
    return this.create();
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

  getUrl(name = this.meta.name) {
    // Add baseUrl in a generic way
    return this.$getters['urlFor'](this.type, this.id, { url: `/api/v1/namespaces/${ name || '' }` });
  }

  // ------------------------------------------------------------------

  confirmRemove() {
    return true;
  }

  async remove() {
    const allTabs = this.$rootGetters['wm/allTabs'];

    if (this.apps?.length && allTabs?.length) {
      this.apps.forEach((e) => {
        const app = this.$getters['byId'](EPINIO_TYPES.APP, `${ this.name }/${ e }`);

        if (!!app && app.meta.namespace === this.name) {
          app.closeWindows();
        }
      });
    }
    await super.remove();
  }

  get warnDeletionMessage() {
    return this.t('epinio.namespace.deleteWarning');
  }
}
