import { createEpinioRoute } from '../utils/custom-routing';
import EpinioResource from './epinio-resource';

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
      cluster:   this.$rootGetters['clusterId'],
      resource:  this.schema.id,
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
