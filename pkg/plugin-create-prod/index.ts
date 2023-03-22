import { importTypes } from '@rancher/auto-import';
import { IPlugin, IProducts } from '@shell/core/types';

import Page1 from './pages/page1.vue';
import Page2 from './pages/page2.vue';
import Page3 from './pages/page3.vue';

import { MANAGEMENT, CAPI } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Register function that will register product and type information
  plugin.initProducts((products: IProducts) => {
    console.error('Product registration');

    // TODO: Product options, group options erc
    // TODO: modifying an existing product's navigation

    // Simple call to add a new product that shows up in the side nav
    const advancedProduct = products.add('advanced');
    const anotherProduct = products.add('another-product');

    console.log('--- ADVANCED PRODUCTION DEFINITION ---', advancedProduct);
    console.log('--- ANOTHER PROD PRODUCTION DEFINITION ---', anotherProduct);

    // Add routes for this product
    // 'names' are relative here to the product name - we will prepend with the product name and a hyphen
    // would be nice if name was optional
    advancedProduct.addRoutes([
      {
        name:      'page1',
        path:      'page1',
        component: Page1
      },
      {
        name:      'page2',
        path:      'page2',
        component: Page2
      },
      {
        name:      'page3',
        path:      'page3',
        component: Page3
      }
    ]);

    // TODO
    // Adds a nav item that goes to the list page for the specified resource
    // advancedProduct.addNavigation('provisioning.cattle.io.cluster');

    // Adds a navigation item to the specified group
    // Creates the group if it does not already exist
    // advancedProduct.addNavigation('catalog.cattle.io.uiplugin', 'advanced');

    // Adds a nav item that goes to the route specified
    // advancedProduct.addNavigation({
    //   name:  'page2',
    //   route: 'page2'
    // });

    advancedProduct.addNavigation([
      {
        type:  'custom-page',
        name:  'page1',
        route: 'page1',
      },
      // {
      //   type: 'resource',
      //   name: 'provisioning.cattle.io.cluster',
      // },
      'provisioning.cattle.io.cluster'
    ]);

    advancedProduct.addNavigation([
      {
        type:   'custom-page',
        name:   'page2',
        route:  'page2',
        weight: 1,
      },
      {
        type:   'custom-page',
        name:   'page3',
        route:  'page3',
        weight: 2,
      },
      {
        type:    'virtual-resource',
        name:    'fake-resource',
        route:   'fake-resource',
        weight:  3,
        options: {
          label:   'a-virtual-resource-label',
          icon:    'gear',
          schemas: [
            {
              id:                'fake-resource',
              type:              'schema',
              collectionMethods: [],
              resourceFields:    {},
              attributes:        { namespaced: true },
            },
          ],
          getInstances: async() => { // method responsible for getting the instance data when we need to access it
            const hash = {
              rancherClusters: advancedProduct.store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }),
              clusters:        advancedProduct.store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }),
            };

            if (advancedProduct.store.getters['management/schemaFor'](MANAGEMENT.NODE)) {
              hash.nodes = advancedProduct.store.dispatch('management/findAll', { type: MANAGEMENT.NODE });
            }

            const res = await allHash(hash);

            return res.rancherClusters.map((c) => {
              return {
                ...c,
                type: 'fake-resource',
              };
            });
          },
        },
      }
    ], { labelKey: 'tab.custom-group-label', weight: 100000000 });

    // anotherProduct.addRoutes([
    //   {
    //     name:      'page1',
    //     path:      'page1',
    //     component: Page1
    //   },
    //   {
    //     name:      'page2',
    //     path:      'page2',
    //     component: Page2
    //   },
    //   {
    //     name:      'page3',
    //     path:      'page3',
    //     component: Page3
    //   }
    // ]);

    // anotherProduct.addNavigation([
    //   {
    //     type:  'custom-page',
    //     name:  'page1',
    //     route: 'page1'
    //   },
    //   // {
    //   //   type: 'resource',
    //   //   name: 'provisioning.cattle.io.cluster',
    //   // },
    //   'provisioning.cattle.io.cluster'
    // ]);

    // anotherProduct.addNavigation([
    //   {
    //     type:  'custom-page',
    //     name:  'page2',
    //     route: 'page2'
    //   },
    //   {
    //     type:  'custom-page',
    //     name:  'page3',
    //     route: 'page3'
    //   },
    //   {
    //     type:    'virtual-resource',
    //     name:    'fake-resource',
    //     route:   'fake-resource',
    //     options: {
    //       label:   'a-virtual-resource-label',
    //       icon:    'gear',
    //       weight:  -1,
    //       schemas: [
    //         {
    //           id:                'fake-resource',
    //           type:              'schema',
    //           collectionMethods: [],
    //           resourceFields:    {},
    //           attributes:        { namespaced: true },
    //         },
    //       ],
    //       getInstances: async() => { // method responsible for getting the instance data when we need to access it
    //         const hash = {
    //           rancherClusters: advancedProduct.store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }),
    //           clusters:        advancedProduct.store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }),
    //         };

    //         if (advancedProduct.store.getters['management/schemaFor'](MANAGEMENT.NODE)) {
    //           hash.nodes = advancedProduct.store.dispatch('management/findAll', { type: MANAGEMENT.NODE });
    //         }

    //         const res = await allHash(hash);

    //         return res.rancherClusters.map((c) => {
    //           return {
    //             ...c,
    //             type: 'fake-resource',
    //           };
    //         });
    //       },
    //     },
    //   }
    // ], { labelKey: 'tab.custom-group-label' });
  });
}
