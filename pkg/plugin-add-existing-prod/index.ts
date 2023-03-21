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
    const explorerProduct = products.get('explorer');

    console.log('--- EXPLORER PRODUCTION DEFINITION ---', explorerProduct);

    if (explorerProduct) {
      // Add routes for this product
      // 'names' are relative here to the product name - we will prepend with the product name and a hyphen
      // would be nice if name was optional
      explorerProduct.addRoutes([
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

      explorerProduct.addNavigation([
        {
          type:  'custom-page',
          name:  'page1',
          route: 'page1'
        },
        'fleet.cattle.io.cluster'
      ]);
    }
  });
}
