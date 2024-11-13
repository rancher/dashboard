# Extension as a cluster-level product
As a full example of an Extension as cluster-level product, let's start with the definition of `product.ts` config:

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

export function init($plugin: IPlugin, store: any) {
  const YOUR_PRODUCT_NAME = 'clusterLevelProduct';
  const YOUR_K8S_RESOURCE_NAME = 'provisioning.cattle.io.cluster';
  const CUSTOM_PAGE_NAME = 'page1';

  const {
    product,
    configureType,
    virtualType,
    basicType
  } = $plugin.DSL(store, YOUR_PRODUCT_NAME);

  // registering a cluster-level product
  product({
    icon:    'gear',
    inStore: 'cluster', // this is what defines the extension as a cluster-level product
    weight:  100,
    to:      {
      name:   `c-cluster-${ YOUR_PRODUCT_NAME }-${ CUSTOM_PAGE_NAME }`,
      params: { product: YOUR_PRODUCT_NAME }
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
      name:   `c-cluster-${ YOUR_PRODUCT_NAME }-resource`,
      params: {
        product:  YOUR_PRODUCT_NAME,
        resource: YOUR_K8S_RESOURCE_NAME
      }
    }
  });

  // creating a custom page
  virtualType({
    labelKey: 'some.translation.key',
    name:     CUSTOM_PAGE_NAME,
    route:    {
      name:   `c-cluster-${ YOUR_PRODUCT_NAME }-${ CUSTOM_PAGE_NAME }`,
      params: { product: YOUR_PRODUCT_NAME }
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
import ListResource from '@shell/pages/c/_cluster/_product/_resource/index.vue';
import CreateResource from '@shell/pages/c/_cluster/_product/_resource/create.vue';
import ViewResource from '@shell/pages/c/_cluster/_product/_resource/_id.vue';
import ViewNamespacedResource from '@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue';
import MyCustomPage from '../pages/myCustomPage.vue';

// to achieve naming consistency throughout the extension
// we recommend this to be defined on a config file and exported
// so that the developer can import it wherever it needs to be used
const YOUR_PRODUCT_NAME = 'clusterLevelProduct';
const CUSTOM_PAGE_NAME = 'page1';

const routes = [
  // this covers the "custom page"
  {
    name:      `c-cluster-${ YOUR_PRODUCT_NAME }-${ CUSTOM_PAGE_NAME }`,
    path:      `/c/:cluster/${ YOUR_PRODUCT_NAME }/${ CUSTOM_PAGE_NAME }`,
    component: MyCustomPage,
    meta:      { product: YOUR_PRODUCT_NAME },
  },
  // the following routes cover the "resource page"
  // registering routes for list/edit/create views
  {
    name:      `c-cluster-${ YOUR_PRODUCT_NAME }-resource`,
    path:      `/c/:cluster/${ YOUR_PRODUCT_NAME }/:resource`,
    component: ListResource,
    meta:      { product: YOUR_PRODUCT_NAME },
  },
  {
    name:      `c-cluster-${ YOUR_PRODUCT_NAME }-resource-create`,
    path:      `/c/:cluster/${ YOUR_PRODUCT_NAME }/:resource/create`,
    component: CreateResource,
    meta:      { product: YOUR_PRODUCT_NAME },
  },
  {
    name:      `c-cluster-${ YOUR_PRODUCT_NAME }-resource-id`,
    path:      `/c/:cluster/${ YOUR_PRODUCT_NAME }/:resource/:id`,
    component: ViewResource,
    meta:      { product: YOUR_PRODUCT_NAME },
  },
  {
    name:      `c-cluster-${ YOUR_PRODUCT_NAME }-resource-namespace-id`,
    path:      `/:cluster/${ YOUR_PRODUCT_NAME }/:resource/:namespace/:id`,
    component: ViewNamespacedResource,
    meta:      { product: YOUR_PRODUCT_NAME },
  }
];

export default routes;
```

> Note: Comparing with a [Top-level product](./top-level-product), we can see that the routes definition in `product.ts` and `/routing/extension-routing.ts` don't have the notion of a `BLANK CLUSTER`. This is on purpose, because a Cluster-level product needs the context of cluster where it's running when compared with a Top-level product, which is "above" all clusters.

A full working example of this code, which can be deployed as an Extension on you Rancher Dashboard, can be found on the [Rancher examples repo](https://github.com/rancher/ui-plugin-examples). Just follow the instructions described on the [README](https://github.com/rancher/ui-plugin-examples#readme) on how to add the repo to Rancher Dasboard.