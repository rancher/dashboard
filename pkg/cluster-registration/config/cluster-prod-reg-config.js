import { routes, clusterProdName } from './cluster-prod-routes-config';
import { setRoute } from '@shell/core/plugin-helpers';

import { MANAGEMENT, CAPI } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export function init($plugin, store) {
  console.log('$plugin init CLUSTER PROD', $plugin);

  $plugin.addToExistingProduct();

  /********************************************************
   *
   *  INSTORE = CLUSTER EXAMPLE
   *
   * ******************************************************/

  /**
   * Object properties for registering an Extension product (cluster level)
   * @property {string} name product name (should be unique)
   * @property {string} label label for product menu entry
   * @property {string} labelKey path for translation of label
   * @property {string} inStore store name to include product
   * @property {function} [enabled] function to evaluate if extension prod is visible or not
   * @property {number} [weight] ordering of the side-menu entry
   * @property {object} to Vue Router object to define where product entry will lead to
   */
  $plugin.registerExtensionProduct({
    name:     clusterProdName,
    labelKey: 'product.labels.extension-in-cluster',
    inStore:  'cluster',
    enabled:  (rootState) => {
      return true;
    },
    weight: 1,
    to:     setRoute('page4', routes)
  });

  $plugin.registerType([
    {
      type:               'custom-page',
      id:                 'page4',
      menuGroupingId:     'new-explorer-prod',
      menuGroupingWeight: 3,
      options:            {
        weight:   2,
        labelKey: 'product.pages.page4',
        icon:     'folder',
        route:    setRoute('page4', routes)
      }
    }
  ]);

  const fakeResourceType = 'harvesterhci.io.management.somedummycluster';

  /**
     * Options properties for registering a virtual-resource (options object)
     * @property {string} label - product name
     * @property {string} labelKey - path for translation of label
     * @property {string} [icon] - icon from Rancher Icons (https://github.com/rancher/icons) - No support for SVGs
     * @property {number} [weight] - ordering of the side-menu entry
     * @property {object} route - Vue Router object to define which route enables access to this page
     * @property {array} schemas - Array of schemas for this CRD
     * @property {async function} getInstances - responsible for fetching the data being displayed for this CRD
     */
  $plugin.updateType({
    type:           'virtual-resource',
    id:             fakeResourceType,
    menuGroupingId: 'new-explorer-prod',
    options:        {
      labelKey: 'product.labels.virtual-resource',
      icon:     'gear',
      weight:   -1,
      route:    setRoute('resource', routes, fakeResourceType),
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
