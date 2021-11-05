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
    // Add baseUrl in a generic way
    return this.$getters['urlFor'](this.type, this.id, { url: `api/v1/namespaces/${ namespace }/services/${ name || '' }` });
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
    // FIXME: Remove once #943 resolved
    this.namespace = metadata.namespace;
    this.name = metadata.name;

    // FIXME: uncomment once #943 resolved
    // this.meta = {
    //   namespace: metadata.namespace,
    //   name:      metadata.name,
    // };
  }

  get metadata() {
    return this.meta || {
      namespace: this.namespace, // FIXME: Remove once #943 resolved
      name:      this.name // FIXME: Remove once #943 resolved
    };
  }

  get meta() {
    return {
      namespace: this.namespace, // FIXME: Remove once #943 resolved
      name:      this.name, // FIXME: Remove once #943 resolved
    };
  }

  get namespaceLocation() {
    return createEpinioRoute(`c-cluster-resource-id`, {
      cluster:   this.$rootGetters['clusterId'],
      resource:  EPINIO_TYPES.NAMESPACE,
      id:       this.meta.namespace,
    });
  }

  get hasCustomList() {
    return true;
  }

  get _key() {
    return this.name;
  }

  async save() {
    await this.followLink('create', {
      method:  'post',
      headers: {
        'content-type': 'application/json',
        accept:         'application/json'
      },
      data: {
        name:          this.meta.name,
        data:          this.data
      }
    });
    const services = await this.$dispatch('findAll', { type: this.type, opt: { force: true } });

    // Find new namespace
    // return new namespace
    return services.filter(n => n.name === this.name)?.[0];
  }
  // ------------------------------------------------------------------
}
