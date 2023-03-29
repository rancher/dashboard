import { BLANK_CLUSTER } from '@shell/store';
import { addRouteToMainRoutingArray } from '@shell/config/router.js';
import ProductLayout from '../layout/product-layout.vue';

export const NAME = 'extensionLayout';

export function init($plugin, store) {
  const { product, basicType, virtualType } = $plugin.DSL(store, NAME);

  console.error('GOING THROUGH PRODUCT CONFIG...');

  // addRouteToMainRoutingArray({
  //   name:   `${ NAME }`,
  //   path:   `/${ NAME }`,
  //   params: {
  //     cluster: BLANK_CLUSTER,
  //     product: NAME,
  //   },
  //   component: ProductLayout
  // });

  product({
    inStore:             'management',
    icon:                'harvester',
    removable:           false,
    showClusterSwitcher: false,
    weight:              100,
    to:                  {
      name:   `${ NAME }`,
      path:   `/${ NAME }`,
      params: {
        cluster: BLANK_CLUSTER,
        product: NAME,
      }
    },
  });

  // basicType(['bananas']);
  // virtualType({
  //   label:  'mainRoute',
  //   group:  'Root',
  //   name:   'bananas',
  //   weight: 500,
  //   route:  {
  //     name:      `${ NAME }-c-cluster`,
  //     component: ProductLayout,
  //     params:    {
  //       product:  NAME,
  //       resource: 'bananas'
  //     }
  //   }
  // });
}
