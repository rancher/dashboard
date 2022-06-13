import ElementalResource from './elemental-resource';
import { insertAt } from '@shell/utils/array';
import { CAPI } from '@shell/config/types';

export default class MachineInventory extends ElementalResource {
  get _availableActions() {
    const out = super._availableActions;

    insertAt(out, out?.length, {
      action:     'createCluster',
      label:      this.t('elemental.osimage.create.createCluster'),
      enabled:    true,
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
