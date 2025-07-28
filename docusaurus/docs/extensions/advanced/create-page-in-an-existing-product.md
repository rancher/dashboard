# Create a page in an existing product

Given that you have covered all of the topics in [Extensions API](../api/overview.md), especially the [Navigation & Pages](../api/nav/products.md) area, we will show an example where you can create an extension that adds a new page to an existing product `Fleet`, which doesn't need any product registration.

Let's take into account this simple `index.ts` entry for an extension:

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

The `product.ts` config will then define the "pages/views" we want to add taking into account the route structure of a `top-level product` such as `Fleet`:

```ts
// ./product.ts
import { IPlugin } from '@shell/core/types';

// this is the definition of a "blank cluster" for Rancher Dashboard
// definition of a "blank cluster" in Rancher Dashboard
const BLANK_CLUSTER = '_';


export function init($plugin: IPlugin, store: any) {
  const FLEET_PROD_NAME = 'fleet';
  const YOUR_K8S_RESOURCE_NAME = 'provisioning.cattle.io.cluster';
  const CUSTOM_PAGE_NAME = 'page1';
  
  const { 
    configureType,
    virtualType,
    basicType
  } = $plugin.DSL(store, FLEET_PROD_NAME);

  
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
      name: `${ FLEET_PROD_NAME }-c-cluster-resource`,
      params: {
        product: FLEET_PROD_NAME,
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
      name:   `${ FLEET_PROD_NAME }-c-cluster-${ CUSTOM_PAGE_NAME }`,
      params: {
        product: FLEET_PROD_NAME,
        cluster: BLANK_CLUSTER
      }
    }
  });

  // registering the defined pages as side-menu entries
  basicType([YOUR_K8S_RESOURCE_NAME, CUSTOM_PAGE_NAME]);
}
```

If the routes follow the same rules for a top-level product like `Fleet` (`product-c-cluster-resource`), then you just need to follow the same route name notation and replace the product name for `fleet`.

The `/routing/extension-routing.ts` needs to follow the same route name principle, such as:

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
const FLEET_PROD_NAME = 'fleet';
const CUSTOM_PAGE_NAME = 'page1';

const routes = [
  // this covers the "custom page"
  {
    name:      `${ FLEET_PROD_NAME }-c-cluster-${ CUSTOM_PAGE_NAME }`,
    path:      `/${ FLEET_PROD_NAME }/c/:cluster/${ CUSTOM_PAGE_NAME }`,
    component: MyCustomPage,
    meta:      {
      product: FLEET_PROD_NAME,
      cluster: BLANK_CLUSTER
    },
  },
  // the following routes cover the "resource page"
  // registering routes for list/edit/create views
  {
    name:      `${ FLEET_PROD_NAME }-c-cluster-resource`,
    path:      `/${ FLEET_PROD_NAME }/c/:cluster/:resource`,
    component: ListResource,
    meta:      {
      product: FLEET_PROD_NAME,
      cluster: BLANK_CLUSTER
    },
  },
  {
    name:      `${ FLEET_PROD_NAME }-c-cluster-resource-create`,
    path:      `/${ FLEET_PROD_NAME }/c/:cluster/:resource/create`,
    component: CreateResource,
    meta:      {
      product: FLEET_PROD_NAME,
      cluster: BLANK_CLUSTER
    },
  },
  {
    name:      `${ FLEET_PROD_NAME }-c-cluster-resource-id`,
    path:      `/${ FLEET_PROD_NAME }/c/:cluster/:resource/:id`,
    component: ViewResource,
    meta:      {
      product: FLEET_PROD_NAME,
      cluster: BLANK_CLUSTER
    },
  },
  {
    name:      `${ FLEET_PROD_NAME }-c-cluster-resource-namespace-id`,
    path:      `/${ FLEET_PROD_NAME }/:cluster/:resource/:namespace/:id`,
    component: ViewNamespacedResource,
    meta:      {
      product: FLEET_PROD_NAME,
      cluster: BLANK_CLUSTER
    },
  }
];

export default routes;
```

And with the above routing, you have successfully registered two new pages and routes inside the `Fleet` product.

This will also work for `Cluster-level products` like `apps`, but remember that to change that product name and follow the correct notation for a cluster-level product `c-cluster-product-resource` like these [examples](../api/nav/routing.md#cluster-level-product---adding-your-defined-routes-to-vue-router).

With this tool, you can extend a lot of the Rancher UI and tailor it to suit your needs.