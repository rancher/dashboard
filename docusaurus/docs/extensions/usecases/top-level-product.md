# Extension as a top-level product
As a full example of an Extension as top-level product, let's start with the definition of `product.ts` config:

```ts
// ./index.ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import extensionRouting from './routing/extension-routing';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide extension metadata from package.json
  // it will grab information such as `name` and `description`
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./product'));

  // Add Vue Routes
  plugin.addRoutes(extensionRouting);
}
```

The `product.ts` config will then define the product and which "pages/views" we want to add, such as:

```ts
// ./product.ts
import { IPlugin } from '@shell/core/types';

// this is the definition of a "blank cluster" for Rancher Dashboard
// definition of a "blank cluster" in Rancher Dashboard
const BLANK_CLUSTER = '_';


export function init($plugin: IPlugin, store: any) {
  const YOUR_PRODUCT_NAME = 'myProductName';
  const YOUR_K8S_RESOURCE_NAME = 'provisioning.cattle.io.cluster';
  const CUSTOM_PAGE_NAME = 'page1';
  
  const { 
    product,
    configureType,
    virtualType,
    basicType
  } = $plugin.DSL(store, YOUR_PRODUCT_NAME);

  // registering a top-level product
  product({
    icon: 'gear',
    inStore: 'management',
    weight: 100,
    to: {
      name: `${ YOUR_PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME }`,
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
      name: `${ YOUR_PRODUCT_NAME }-c-cluster-resource`,
      params: {
        product: YOUR_PRODUCT_NAME,
        cluster: BLANK_CLUSTER,
        resource: YOUR_K8S_RESOURCE_NAME
      }
    }
  });

  

  // creating a custom page
  virtualType({
    labelKey: 'some.translation.key',
    name:     CUSTOM_PAGE_NAME,
    route:    {
      name:   `${ YOUR_PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME }`,
      params: {
        product: YOUR_PRODUCT_NAME,
        cluster: BLANK_CLUSTER
      }
    }
  });

  // registering the defined pages as side-menu entries
  basicType([YOUR_K8S_RESOURCE_NAME, CUSTOM_PAGE_NAME]);
}
```


In the example above, we are registering 2 pages: a resource page called `YOUR_K8S_RESOURCE_NAME` and a custom page called `CUSTOM_PAGE_NAME`. These need to be reflected in the routes definition that is provided to the `addRoutes` method.

> Note: For more information on routing for a Top-level-product, check [here](../api/nav/routing.md#routes-definition-for-an-extension-as-a-top-level-product)

The `/routing/extension-routing.ts` would then be defined like:

```ts
// ./routing/extension-routing.ts
// definition of a "blank cluster" in Rancher Dashboard
const BLANK_CLUSTER = '_';

import MyCustomPage from '../pages/myCustomPage.vue';
import ListResource from '@shell/pages/c/_cluster/_product/_resource/index.vue';
import CreateResource from '@shell/pages/c/_cluster/_product/_resource/create.vue';
import ViewResource from '@shell/pages/c/_cluster/_product/_resource/_id.vue';
import ViewNamespacedResource from '@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue';

// to achieve naming consistency throughout the extension
// we recommend this to be defined on a config file and exported
// so that the developer can import it wherever it needs to be used
const YOUR_PRODUCT_NAME = 'the-name-of-your-product';
const CUSTOM_PAGE_NAME = 'page1';

const routes = [
  // this covers the "custom page"
  {
    name:      `${ YOUR_PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME }`,
    path:      `/${ YOUR_PRODUCT_NAME }/c/:cluster/${ CUSTOM_PAGE_NAME }`,
    component: MyCustomPage,
    meta:      {
      product: YOUR_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    },
  },
  // the following routes cover the "resource page"
  // registering routes for list/edit/create views
  {
    name:      `${ YOUR_PRODUCT_NAME }-c-cluster-resource`,
    path:      `/${ YOUR_PRODUCT_NAME }/c/:cluster/:resource`,
    component: ListResource,
    meta:      {
      product: YOUR_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    },
  },
  {
    name:      `${ YOUR_PRODUCT_NAME }-c-cluster-resource-create`,
    path:      `/${ YOUR_PRODUCT_NAME }/c/:cluster/:resource/create`,
    component: CreateResource,
    meta:      {
      product: YOUR_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    },
  },
  {
    name:      `${ YOUR_PRODUCT_NAME }-c-cluster-resource-id`,
    path:      `/${ YOUR_PRODUCT_NAME }/c/:cluster/:resource/:id`,
    component: ViewResource,
    meta:      {
      product: YOUR_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    },
  },
  {
    name:      `${ YOUR_PRODUCT_NAME }-c-cluster-resource-namespace-id`,
    path:      `/${ YOUR_PRODUCT_NAME }/:cluster/:resource/:namespace/:id`,
    component: ViewNamespacedResource,
    meta:      {
      product: YOUR_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    },
  }
];

export default routes;
```

A full working example of this code, which can be deployed as an Extension on you Rancher Dashboard, can be found on the [Rancher examples repo](https://github.com/rancher/ui-plugin-examples). Just follow the instructions described on the [README](https://github.com/rancher/ui-plugin-examples#readme) on how to add the repo to Rancher Dasboard.