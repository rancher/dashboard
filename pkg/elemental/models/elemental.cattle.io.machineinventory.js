import ElementalResource from './elemental-resource';
import { CAPI } from '@shell/config/types';
import { ELEMENTAL_CLUSTER_PROVIDER } from '../types';

export default class MachineInventory extends ElementalResource {
  constructor() {
    super(...arguments);

    if (!this.metadata) {
      this.metadata = {};
    }

    // we want to default to namespace 'fleet-default' for creation scenario...
    if (!this.id) {
      this.metadata.namespace = 'fleet-default';
    }
  }

  get _availableActions() {
    const out = super._availableActions;

    out.push({
      action:     'createCluster',
      bulkAction: 'createCluster',
      label:      this.t('elemental.osimage.create.createCluster'),
      enabled:    true,
      bulkable:   true
    });

    return out;
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
