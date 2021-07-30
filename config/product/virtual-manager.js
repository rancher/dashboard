import { HCI, MANAGEMENT, VIRTUAL_PROVIDER, CAPI } from '@/config/types';
import { MULTI_CLUSTER } from '@/store/features';
import { DSL } from '@/store/type-map';
import { STATE, NAME as NAME_COL, AGE, VERSION } from '@/config/table-headers';
import { allHash } from '@/utils/promise';

export const NAME = 'virtualManager';

const MACHINE_POOLS = {
  name:      'summary',
  labelKey:  'tableHeaders.machines',
  sort:      false,
  search:    false,
  value:    'nodes.length',
  align:     'center',
  width:     100,
};

export function init(store) {
  const {
    product,
    basicType,
    headers,
    spoofedType,
    configureType
  } = DSL(store, NAME);

  product({
    ifFeature:           MULTI_CLUSTER,
    inStore:             'management',
    icon:                'harvester',
    removable:           false,
    showClusterSwitcher: false,
  });

  configureType(HCI.CLUSTER, { showListMasthead: false });
  headers(HCI.CLUSTER, [
    STATE,
    NAME_COL,
    {
      ...VERSION,
      value: 'kubernetesVersion'
    },
    MACHINE_POOLS,
    AGE
  ]);
  basicType([HCI.CLUSTER]);
  spoofedType({
    label:      store.getters['i18n/t']('harvester.manager.cluster.label'),
    name:       HCI.CLUSTER,
    type:       HCI.CLUSTER,
    namespaced: true,
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
        attributes:        { namespaced: true },
      },
    ],
    group:        'Root',
    getInstances: async() => {
      const hash = {
        clusters: store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }),
        nodes:    store.dispatch('management/findAll', { type: MANAGEMENT.NODE }),
      };

      const res = await allHash(hash);

      return res.clusters.filter(c => c?.metadata?.labels?.['provider'] === VIRTUAL_PROVIDER).map((c) => {
        return {
          ...c,
          type: HCI.CLUSTER,
        };
      });
    },
  });
}
