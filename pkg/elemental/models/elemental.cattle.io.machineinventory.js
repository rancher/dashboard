import ElementalResource from './elemental-resource';
import { CAPI } from '@shell/config/types';
import { ELEMENTAL_DEFAULT_NAMESPACE } from '../types';
import { ELEMENTAL_CLUSTER_PROVIDER, ELEMENTAL_SCHEMA_IDS } from '@shell/config/elemental-types';

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

  get clusterName() {
    if (this.metadata.ownerReferences && this.metadata.ownerReferences.length) {
      const invSelectorName = this.metadata.ownerReferences[0].name;

      const machineInvSelector = this.$getters['all'](ELEMENTAL_SCHEMA_IDS.MACHINE_INV_SELECTOR).find(item => item.metadata.name === invSelectorName);

      if (machineInvSelector && machineInvSelector.metadata?.labels && machineInvSelector.metadata?.labels['rke.cattle.io/cluster-name']) {
        return machineInvSelector.metadata?.labels['rke.cattle.io/cluster-name'];
      }
    }

    return '---';
  }
}
