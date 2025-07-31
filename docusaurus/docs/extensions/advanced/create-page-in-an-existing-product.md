# Create a page in an existing product

Given that you have covered all of the topics in [Extensions API](../api/overview.md), especially the [Navigation & Pages](../api/nav/products.md) area, we will show an example of how you can create an extension that adds a new page to an existing product `Fleet`. This doesn't need any product registration.

> To do this in other areas/products of the Rancher UI, simply take a look at the routing structure in the browser url and don't forget to follow the same structure.

> **CAVEAT:** In our docs we recommend following the routes pattern of `product-c-cluster-resource` for top-level products and `c-cluster-product-resource` for cluster-level products, but you may find that some top-level products like `Fleet` do follow a `c-cluster-product-resource`. While the route structure is not mandatory right now, it's a guideline that has proven to be important for developers when following the documentation so that they associate different products with different route structures.

Taking `Fleet` as an example, let's dive into the code for `index.ts` entry for an extension:

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

The following `product.ts` config is expanding on the product definition in [shell/config/product/fleet](https://github.com/rancher/dashboard/blob/master/shell/config/product/fleet.js) and is where we define the "pages/views" we want to add taking into account the route structure of `Fleet`:

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

  // creating a custom page
  virtualType({
    labelKey: 'some.translation.key',
    name:     CUSTOM_PAGE_NAME,
    route:    {
      name:   `c-cluster-${ FLEET_PROD_NAME }-${ CUSTOM_PAGE_NAME }`,
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

If the routes follow the same rules for a top-level product like `Fleet` (`c-cluster-product-resource`), then you just need to follow the same route name notation and replace the product name for `fleet`.

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
    name:      `c-cluster-${ FLEET_PROD_NAME }-${ CUSTOM_PAGE_NAME }`,
    path:      `/c/:cluster/${ FLEET_PROD_NAME }/${ CUSTOM_PAGE_NAME }`,
    component: MyCustomPage,
    meta:      {
      product: FLEET_PROD_NAME,
      cluster: BLANK_CLUSTER
    },
  }
];

export default routes;
```

And with the above routing, you have successfully registered a new custom and route inside the `Fleet` product.

This will also work for `Cluster-level products` like `apps`, but remember that to change that product name and follow the correct notation for a cluster-level product `c-cluster-product-resource` like these [examples](../api/nav/routing.md#cluster-level-product---adding-your-defined-routes-to-vue-router).

With this tool, you can extend a lot of the Rancher UI and tailor it to suit your needs.