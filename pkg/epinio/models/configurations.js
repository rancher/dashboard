import { EPINIO_TYPES } from '../types';
import EpinioNamespacedResource from './epinio-namespaced-resource';

export default class EpinioConfigurationModel extends EpinioNamespacedResource {
  get canCustomEdit() {
    return !this.isServiceRelated;
  }

  get _canDelete() {
    return !this.isServiceRelated && super._canDelete;
  }

  // ------------------------------------------------------------------

  get links() {
    return {
      update: this.getUrl(),
      self:   this.getUrl(),
      remove: this.getUrl(),
      create: this.getUrl(this.meta?.namespace, null),
    };
  }

  getUrl(namespace = this.meta?.namespace, name = this.meta?.name) {
    return this.$getters['urlFor'](this.type, this.id, { url: `/api/v1/namespaces/${ namespace }/configurations/${ name || '' }` });
  }

  get applications() {
    const all = this.$getters['all'](EPINIO_TYPES.APP);

    return (this.configuration.boundapps || []).reduce((res, appName) => {
      const a = all.find(allA => allA.meta.name === appName);

      if (a) {
        res.push(a);
      }

      return res;
    }, []);
  }

  get variableCount() {
    return Object.keys(this.configuration?.details || {}).length;
  }

  get isServiceRelated() {
    return !!this.configuration?.origin;
  }

  get service() {
    return this.isServiceRelated ? this.$getters['byId'](EPINIO_TYPES.SERVICE_INSTANCE, `${ this.meta.namespace }/${ this.configuration.origin }`) : null;
  }

  // ------------------------------------------------------------------

  trace(text, ...args) {
    console.log(`### Config: ${ text }`, `${ this.meta.namespace }/${ this.meta.name }`, args);// eslint-disable-line no-console
  }

  async create() {
    this.trace('Create the config resource');

    await this.followLink('create', {
      method:  'post',
      headers: {
        'content-type': 'application/json',
        accept:         'application/json'
      },
      data: {
        name: this.meta.name,
        data: { ...this.data }
      }
    });
  }

  async update() {
    this.trace('Update the config resource');
    await this.followLink('update', {
      method:  'put',
      headers: {
        'content-type': 'application/json',
        accept:         'application/json'
      },
      data: { ...this.data }
    });
  }

  async remove() {
    return await super.remove({ data: { unbind: true } });
  }

  // ------------------------------------------------------------------
}
