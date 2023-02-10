import { createEpinioRoute } from '../utils/custom-routing';
import EpinioResource from './epinio-resource';

export const bulkRemove = async(items, opt = {}) => {
  const model = items[0];

  if ( !opt.url ) {
    opt.url = model.linkFor('self').replace(/\/[^\/]+$/, '?');
  }
  opt.method = 'delete';
  opt.data = JSON.stringify({ unbind: false });

  // Separates the resources by namespace
  const _byNamespace = items.reduce((acc, cur) => {
    const { namespace, name } = cur.meta;

    if (!acc[namespace]) {
      acc[namespace] = [];
    }

    acc[namespace].push(name);

    return acc;
  }, {});

  const resPerNS = Object
    .keys(_byNamespace)
    .reduce((acc, cur) => {
      acc[cur] = _byNamespace[cur]
        .map(_e => `${ model.type }[]=${ _e }`)
        .join('&');

      return acc;
    }, {});

  // Call the bulk remove for each namespace
  await Promise.all(Object.entries(resPerNS).map(([key, value]) => {
    const safeOpt = { ...opt };

    safeOpt.url = `${ safeOpt.url?.replace(/\/([^\/]*)\/([^\/]*)\/([^\/]*)\/([^\/]*)/, `/$1/$2/$3/${ key }`) }${ value }`;

    return model.$dispatch('request', { opt: safeOpt, type: model.type });
  }));

  // Remove from store, so we don't wait for poll to show resources removed
  items.forEach(i => model.$dispatch('remove', i));

  console.log('### Resource Bulk Remove', model.type, items?.map(ele => ele?.id), opt); // eslint-disable-line no-console
};

export default class EpinioMetaResource extends EpinioResource {
  constructor() {
    super(...arguments);
    if (!this.meta) {
      this.meta = {
        name:              '',
        namespace:         undefined,
        creationTimestamp: '',
      };
    }
  }

  set metadata(metadata) {
    this.meta = {
      namespace: metadata.namespace,
      name:      metadata.name,
    };
  }

  get metadata() {
    return {
      ...this.meta,
      creationTimestamp: this.meta.createdAt
    };
  }

  get namespaceLocation() {
    return createEpinioRoute(`c-cluster-resource-id`, {
      cluster:  this.$rootGetters['clusterId'],
      resource: this.schema.id,
      id:       this.meta.namespace,
    });
  }

  async forceFetch() {
    await this.$dispatch('find', {
      type: this.type,
      id:   `${ this.meta.namespace }/${ this.meta.name }`,
      opt:  { force: true }
    });
  }

  get detailLocation() {
    const schema = this.$getters['schemaFor'](this.type);

    const id = this.id?.replace(/.*\//, '');

    return createEpinioRoute(`c-cluster-resource${ schema?.attributes?.namespaced ? '-namespace' : '' }-id`, {
      cluster:   this.$rootGetters['clusterId'],
      resource:  this.type,
      id,
      namespace: this.meta?.namespace,
    });
  }

  get name() {
    return this.meta?.name;
  }
}
