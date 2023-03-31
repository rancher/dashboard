// this is the definition of a "blank cluster" for Rancher Dashboard
import { BLANK_CLUSTER } from '@shell/store';

export function init($plugin, store) {
  const YOUR_PRODUCT_NAME = 'myProd';
  const YOUR_K8S_RESOURCE_NAME = 'apiregistration.k8s.io.apiservice';
  const CUSTOM_PAGE_NAME_1 = 'page1';
  const CUSTOM_PAGE_NAME_2 = 'page2';
  const CUSTOM_PAGE_NAME_3 = 'page3';

  const {
    product,
    configureType,
    virtualType,
    basicType,
    weightType,
    weightGroup
  } = $plugin.DSL(store, YOUR_PRODUCT_NAME);

  // registering a top-level product
  product({
    icon:    'gear',
    inStore: 'management',
    weight:  100,
    to:      {
      name:   `${ YOUR_PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME_2 }`,
      params: {
        product: YOUR_PRODUCT_NAME,
        cluster: BLANK_CLUSTER
      }
    }
  });

  // defining a k8s resource as page
  configureType(YOUR_K8S_RESOURCE_NAME, {
    displayName: 'some-custom-name-you-wish-to-assign-to-this-resource',
    isCreatable: true,
    isEditable:  true,
    isRemovable: true,
    showAge:     true,
    showState:   true,
    canYaml:     true,
    customRoute: {
      name:   `${ YOUR_PRODUCT_NAME }-c-cluster-resource`,
      params: {
        product:  YOUR_PRODUCT_NAME,
        cluster:  BLANK_CLUSTER,
        resource: YOUR_K8S_RESOURCE_NAME
      }
    }
  });

  // creating a custom page
  virtualType({
    labelKey: 'some.translation.key',
    name:     CUSTOM_PAGE_NAME_1,
    route:    {
      name:   `${ YOUR_PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME_1 }`,
      params: {
        product: YOUR_PRODUCT_NAME,
        cluster: BLANK_CLUSTER
      }
    }
  });

  // creating yet another custom page
  virtualType({
    labelKey: 'some.translation.key',
    name:     CUSTOM_PAGE_NAME_2,
    route:    {
      name:   `${ YOUR_PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME_2 }`,
      params: {
        product: YOUR_PRODUCT_NAME,
        cluster: BLANK_CLUSTER
      }
    }
  });

  virtualType({
    labelKey: 'some.translation.key',
    name:     CUSTOM_PAGE_NAME_3,
    route:    {
      name:   `${ YOUR_PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME_3 }`,
      params: {
        product: YOUR_PRODUCT_NAME,
        cluster: BLANK_CLUSTER
      }
    }
  });

  // registering some of the defined pages as side-menu entries in the root level
  basicType([CUSTOM_PAGE_NAME_2, CUSTOM_PAGE_NAME_3]);

  // registering some of the defined pages as side-menu entries in a group
  basicType([YOUR_K8S_RESOURCE_NAME, CUSTOM_PAGE_NAME_1], 'myAdvancedGroup');

  weightType(CUSTOM_PAGE_NAME_1, 2, true);
  weightType(YOUR_K8S_RESOURCE_NAME, 1, true);
  weightType(CUSTOM_PAGE_NAME_3, 2, true);
  weightType(CUSTOM_PAGE_NAME_2, 1, true);

  // => => => ordering of the grouped entry
  weightGroup('myAdvancedGroup', 1001, true);
}
