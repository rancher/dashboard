import { HCI, MANAGEMENT, VIRTUAL_PROVIDER } from '@/config/types';
import { MULTI_CLUSTER } from '@/store/features';
import { DSL } from '@/store/type-map';

export const NAME = 'virtualManager';

export function init(store) {
  const {
    product,
    basicType,
    spoofedType,
  } = DSL(store, NAME);

  product({
    ifFeature:           MULTI_CLUSTER,
    inStore:             'management',
    icon:                'harvester',
    removable:           false,
    showClusterSwitcher: false,
  });

  basicType([HCI.CLUSTER]);
  spoofedType({
    label:      store.getters['i18n/t']('harvester.manager.cluster.label'),
    name:       HCI.CLUSTER,
    type:       HCI.CLUSTER,
    namespaced: false,
    weight:     -1,
    route:      {
      name:     'c-cluster-product-resource',
      params:   {
        product:  NAME,
        resource: HCI.CLUSTER,
      }
    },
    exact:   false,
    schemas: [
      {
        id:                HCI.CLUSTER,
        type:              'schema',
        collectionMethods: [],
        resourceFields:    {},
      },
    ],
    group:        'Root',
    getInstances: async() => {
      const clusters = await store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });

      return clusters.filter(c => c.status?.provider === VIRTUAL_PROVIDER);
    }
  });
}
