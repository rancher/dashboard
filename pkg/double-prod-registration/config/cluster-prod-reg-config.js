import { routes as routes3, clusterProdName } from './cluster-prod-routes-config';
import { setRoute } from '@shell/core/plugin-helpers';

import { MANAGEMENT, CAPI } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export function init($plugin, store) {
  console.log('$plugin init CLUSTER PROD', $plugin);

  const product = $plugin.addToExistingProduct(clusterProdName, {
    name:    clusterProdName,
    label:   'bananas',
    // labelKey: 'product.labels.extension-in-cluster',
    inStore: 'cluster',
    enabled: (rootState) => {
      return true;
    },
    weight: 1,
    to:     setRoute('page5', routes3)
  });

  // $plugin.registerAsProduct({
  //   name:     clusterProdName,
  //   labelKey: 'product.labels.extension-in-cluster',
  //   inStore:  'cluster',
  //   enabled:  (rootState) => {
  //     return true;
  //   },
  //   weight: 1,
  //   to:     setRoute('page5', routes3)
  // });

  product.registerType([
    {
      type:               'custom-page',
      id:                 'page5',
      menuGroupingId:     'newExplorerProdDouble',
      menuGroupingWeight: 3,
      options:            {
        weight:   2,
        labelKey: 'product.pages.page5',
        icon:     'folder',
        route:    setRoute('page5', routes3)
      }
    }
  ]);

  const fakeResourceType = 'harvesterhci.io.management.somedummycluster';

  product.updateType({
    type:           'virtual-resource',
    id:             fakeResourceType,
    menuGroupingId: 'newExplorerProdDouble',
    options:        {
      labelKey: 'product.labels.virtual-resource',
      icon:     'gear',
      weight:   -1,
      route:    setRoute('resource', routes3, fakeResourceType),
      schemas:  [
        {
          id:                fakeResourceType,
          type:              'schema',
          collectionMethods: [],
          resourceFields:    {},
          attributes:        { namespaced: true },
        },
      ],
      getInstances: async() => { // method responsible for getting the instance data when we need to access it
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
            type: fakeResourceType,
          };
        });
      },
    }
  });
}
