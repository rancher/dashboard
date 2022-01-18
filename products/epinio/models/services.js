import { EPINIO_TYPES } from '@/products/epinio/types';
import { createEpinioRoute } from '@/products/epinio/utils/custom-routing';
import EpinioResource from './epinio-resource';

// POST - {"name":"my-service","data":{"foo":"bar"}}
// GET - { "boundapps": null, "name": "my-service" }

export default class EpinioService extends EpinioResource {
  get links() {
    return {
      update: this.getUrl(),
      self:   this.getUrl(),
      remove: this.getUrl(),
      create: this.getUrl(this.meta?.namespace, null),
    };
  }

  getUrl(namespace = this.meta?.namespace, name = this.meta?.name) {
    return this.$getters['urlFor'](this.type, this.id, { url: `/api/v1/namespaces/${ namespace }/services/${ name || '' }` });
  }

  get applications() {
    const all = this.$getters['all'](EPINIO_TYPES.APP);

    return (this.boundapps || []).reduce((res, appName) => {
      const a = all.find(allA => allA.meta.name === appName);

      if (a) {
        res.push(a);
      }

      return res;
    }, []);
  }

  // ------------------------------------------------------------------
  // Methods here are required for generic components to handle `namespaced` concept

  set metadata(metadata) {
    this.meta = {
      namespace: metadata.namespace,
      name:      metadata.name,
    };
  }

  get metadata() {
    return this.meta;
  }

  get namespaceLocation() {
    return createEpinioRoute(`c-cluster-resource-id`, {
      cluster:   this.$rootGetters['clusterId'],
      resource:  EPINIO_TYPES.NAMESPACE,
      id:       this.meta.namespace,
    });
  }

  trace(text, ...args) {
    console.log(`### Service: ${ text }`, `${ this.meta.namespace }/${ this.meta.name }`, args);// eslint-disable-line no-console
  }

  async create() {
    this.trace('Create the application resource');

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
    this.trace('Update the application resource');
    await this.followLink('update', {
      method:  'patch',
      headers: {
        'content-type': 'application/json',
        accept:         'application/json'
      },
      data: {
        name: this.meta.name,
        edit: { ...this.data }
      }
    });
  }

  // ------------------------------------------------------------------
}
