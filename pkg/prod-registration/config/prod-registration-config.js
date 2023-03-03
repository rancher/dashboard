import { CAPI } from '@shell/config/types';
import { BLANK_CLUSTER } from '@shell/store';

const NAME = 'productregistration';

export function init($plugin, store) {
  const {
    product,
    virtualType,
    basicType,
    headers,
    spoofedType,
    configureType
  } = $plugin.DSL(store, NAME);

  product({
    ifHaveType:          CAPI.RANCHER_CLUSTER,
    inStore:             'management',
    icon:                'gear',
    removable:           false,
    showClusterSwitcher: false,
    weight:              100,
    to:                  {
      name:   'c-cluster-product',
      params: {
        cluster: BLANK_CLUSTER,
        product: NAME
      }
    },
  });

  virtualType({
    label:  'My dashboard view',
    icon:   'folder',
    group:  'Root',
    // namespaced:   false,
    name:   'dashboard-view',
    weight: 1,
    route:  {
      name:   'c-cluster-product',
      params: {
        cluster: BLANK_CLUSTER,
        product: NAME
      }
    }
  });

  virtualType({
    label:  'Page 2',
    icon:   'folder',
    group:  'Root',
    // namespaced:   false,
    name:   'page2-view',
    weight: 1,
    route:  {
      name:   'c-cluster-product-resource',
      params: {
        cluster:  BLANK_CLUSTER,
        product:  NAME,
        resource: 'page2'
      }
    }
  });

  basicType(['dashboard-view', 'page2-view']);
}
