import { HCI, MANAGEMENT, CAPI } from '@shell/config/types';
import { HARVESTER, MULTI_CLUSTER } from '@shell/store/features';
import { DSL } from '@shell/store/type-map';
import { STATE, NAME as NAME_COL, AGE, VERSION } from '@shell/config/table-headers';
import { allHash } from '@shell/utils/promise';
import dynamicPluginLoader from '@shell/pkg/dynamic-plugin-loader';
import { BLANK_CLUSTER } from '@shell/store';

dynamicPluginLoader.register({
  load: async({ route, store }) => {
    // Check that we've either got here either
    // - directly (page refresh/load -> have path but no name)
    // - via router name (have name but no path)
    let clusterId;
    const pathParts = route.path.split('/');

    if (pathParts?.[1] === HARVESTER_NAME && pathParts?.[3] ) {
      clusterId = pathParts?.[3];
    } else {
      const nameParts = route.name?.split('-');

      if (nameParts?.[0] === HARVESTER_NAME) {
        clusterId = route.params?.cluster;
      }
    }

    if (clusterId) {
      // All is good, try to load the plugin via the harvester cluster's `loadClusterPlugin`
      const provClusters = await store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER });
      const provCluster = provClusters.find(p => p.mgmt.id === clusterId);

      if (provCluster) {
        const harvCluster = await store.dispatch('management/create', {
          ...provCluster,
          type: HCI.CLUSTER
        });

        if (harvCluster) {
          // TODO: RC do we need to handle this use case? when is the user nav'ing to an emebbed harvester page?

          // try {
          await harvCluster.loadClusterPlugin();

          return route;
          // } catch (err) {
          //   // TODO: RC do we need to handle this use case? when is the user nav'ing to an emebbed harvester page?
          //   const message = typeof error === 'object' ? JSON.stringify(err) : err;

          //   console.error('Failed to loading harvester package: ', message);
          //   // https://localhost:8005/harvester/c/c-m-h6gkksqj/kubevirt.io.virtualmachine

          //   const url = harvCluster.standaloneUrl();

          //   return { fullpath: url };
          // }
        }
      }
    }
  }
});

export const NAME = 'harvesterManager';

export const HARVESTER_NAME = 'harvester';

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
    ifHaveType:          CAPI.RANCHER_CLUSTER,
    ifFeature:           [MULTI_CLUSTER, HARVESTER],
    inStore:             'management',
    icon:                'harvester',
    removable:           false,
    showClusterSwitcher: false,
    weight:              100,
    to:                   {
      name:   'c-cluster-product-resource',
      params: {
        cluster:  BLANK_CLUSTER,
        product:  NAME,
        resource: HCI.CLUSTER
      }
    },
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
    AGE,
    {
      name:  'harvester',
      label: ' ',
      align: 'right',
      width: 65,
    },
  ]);
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
        attributes:        { namespaced: true },
      },
    ],
    group:        'Root',
    getInstances: async() => {
      const hash = {
        rancherClusters: store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }),
        clusters:        store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }),
      };

      if (store.getters['management/schemaFor'](MANAGEMENT.NODE)) {
        hash.nodes = store.dispatch('management/findAll', { type: MANAGEMENT.NODE });
      }

      const res = await allHash(hash);

      return res.rancherClusters.map((c) => {
        return {
          ...c,
          type: HCI.CLUSTER,
        };
      });
    },
  });
}
