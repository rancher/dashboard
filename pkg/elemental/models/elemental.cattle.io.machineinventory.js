import ElementalResource from './elemental-resource';
import { CAPI } from '@shell/config/types';
import { ELEMENTAL_DEFAULT_NAMESPACE } from '../types';
import { ELEMENTAL_CLUSTER_PROVIDER } from '@shell/config/elemental-types';

export default class MachineInventory extends ElementalResource {
  constructor() {
    super(...arguments);

    if (!this.metadata) {
      this.metadata = {};
    }

    // we want to default to namespace XXX for creation scenario...
    if (!this.id) {
      this.metadata.namespace = ELEMENTAL_DEFAULT_NAMESPACE;
    }
  }

  get _availableActions() {
    const out = super._availableActions;

    if (this.canCreateCluster) {
      out.push({
        action:     'createCluster',
        bulkAction: 'createCluster',
        label:      this.t('elemental.osimage.create.createCluster'),
        enabled:    true,
        bulkable:   true
      });
    }

    return out;
  }

  get canCreateCluster() {
    const schema = this.$rootGetters['management/schemaFor'](CAPI.RANCHER_CLUSTER);

    return !!schema?.collectionMethods.find(x => x.toLowerCase() === 'post');
  }

  createCluster() {
    this.currentRouter().push({
      name:   'c-cluster-product-resource-create',
      params: {
        resource: CAPI.RANCHER_CLUSTER,
        product:  'manager',
      },
      query: { type: ELEMENTAL_CLUSTER_PROVIDER }
    });
  }
}
