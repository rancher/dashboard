// Added by Verrazzano
import Pod from '@shell/models/pod';

export default class ClusteredPod extends Pod {
  get _detailLocation() {
    const schema = this.$getters['schemaFor'](this.type);

    const id = this.id?.replace(/.*\//, '');

    return {
      name:   `c-cluster-product-resource${ schema?.attributes?.namespaced ? '-namespace' : '' }-id`,
      params: {
        product:   'explorer',
        cluster:   this.cluster ? this.cluster : this.$rootGetters['clusterId'],
        resource:  this.type,
        namespace: this.metadata?.namespace,
        id,
      }
    };
  }
}
