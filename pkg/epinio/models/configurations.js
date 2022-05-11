import { EPINIO_TYPES } from '../types';
import EpinioNamespacedResource from './epinio-namespaced-resource';

// POST - {"name":"my-service","data":{"foo":"bar"}}
// GET - { "boundapps": null, "name": "my-service" }

export default class EpinioConfiguration extends EpinioNamespacedResource {
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
