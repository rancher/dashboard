import ElementalResource from './elemental-resource';
import { CAPI } from '@shell/config/types';

export default class MachineInventory extends ElementalResource {
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
      query: { type: 'elemental' }
    });
  }
}
