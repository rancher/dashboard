# Routing

## Routes definition for an Extension as a top-level product
Extensions should use a `pages` directory, as the shell currently does, but routing needs to be explicitly defined then added in the extension index using the extension `addRoutes` method. Extension routes can override existing dashboard routes: they'll be loaded on extension entry and unloaded (with old dashboard routes re-loaded...) on extension leave. 

As touched on above, cluster and product information used to connect to the cluster and define navigation is determined from the route. Consequently, while extensions have a lot of control over their own routing, anything tied into one kubernetes cluster should be nested in `pages/c/_cluster`.

> Note: All of the routes defined when setting up your Extension product (`product.ts`) need to be defined as routes with the `addRoutes` method.

Within the `index.ts` in your root folder, where you define your extension configuration, you can just use the `addRoutes` extension method, such as:

```ts
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

  // => => => Add Vue Routes
  plugin.addRoutes(extensionRouting);
}
```

Let's then take into consideration the following example a of `product.ts` config:

```ts
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
      },
      meta: {
        product: YOUR_PRODUCT_NAME
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
      },
      meta: {
        product: YOUR_PRODUCT_NAME,
        cluster: BLANK_CLUSTER
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
      },
      meta: {
        product: YOUR_PRODUCT_NAME,
        cluster: BLANK_CLUSTER
      }
    }
  });

  // => => => registering the defined pages as side-menu entries
  basicType([YOUR_K8S_RESOURCE_NAME, CUSTOM_PAGE_NAME]);
}
```

One above example we are registering 2 pages: a resource page called `YOUR_K8S_RESOURCE_NAME` and a custom page called `CUSTOM_PAGE_NAME`. These need to be reflected in the routes definition that is provided to the `addRoutes` method.

Please note that for a Top-level product, routing follows a defined pattern:

```js
route: {
  name:   `${ YOUR_PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME }`,
  params: { 
    product: YOUR_PRODUCT_NAME, 
    cluster: BLANK_CLUSTER 
  },
  meta: {
    product: YOUR_PRODUCT_NAME,
    cluster: BLANK_CLUSTER
  }
}
```

Within the params property, we define **cluster** as `BLANK_CLUSTER`. `BLANK_CLUSTER` is a notion on which Rancher will ignore the context of the cluster the user is browsing, which is the desired effect when creating a product that is "above" the notion of a cluster.

This pattern is a very important aspect for Top-level products that you should be mindful at all times when creating a product of this type.

Considering the above, `/routing/extension-routing.ts` would then have to be defined like:

```ts
// custom pages should be created as VueJS components. Usually stored on the /pages folder on the extension
// definition of a "blank cluster" in Rancher Dashboard
const BLANK_CLUSTER = '_';

import MyCustomPage from '../pages/myCustomPage.vue';

// to achieve naming consistency throughout the extension
// we recommend this to be defined on a config file and exported
// so that the developer can import it wherever it needs to be used
const YOUR_PRODUCT_NAME = 'myProductName';
const CUSTOM_PAGE_NAME = 'page1';

const routes = [
  // this is an example of a custom page if you wanted to register one
  {
    name:      `${ YOUR_PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME }`,
    path:      `/${ YOUR_PRODUCT_NAME }/c/:cluster/${ CUSTOM_PAGE_NAME }`,
    component: MyCustomPage,
    meta:      {
      product: YOUR_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    },
  }
];

export default routes;
```

> Note: the `meta` parameter is mandatory in order for the routes to work properly!

On the above example, we are registering the route for our custom page called `CUSTOM_PAGE_NAME`. At this point we are still missing the route for `YOUR_K8S_RESOURCE_NAME`, which we will cover next. 

Just to reinforce the message, it is imperative that the `name` and `path` follow this convention needed for Extension top-level products, which we cover on this [overview](../../api/concepts.md#overview-on-routing-structure-for-a-top-level-extension-product).

As you can see, we've added a `meta` parameter with the product and cluster names. This is necessary to exist on the routes definition in order to ensure that all the wiring "under the hood" is handled correctly by Rancher Dashboard.

Now, for a resource page like `YOUR_K8S_RESOURCE_NAME`, one can leverage the usage of the default components for a list/create/edit routes used on Rancher Dashboard in such a way:

```ts
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
const YOUR_PRODUCT_NAME = 'myProductName';
const CUSTOM_PAGE_NAME = 'page1';

const routes = [
  {
    name:      `${ YOUR_PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME }`,
    path:      `/${ YOUR_PRODUCT_NAME }/c/:cluster/${ CUSTOM_PAGE_NAME }`,
    component: MyCustomPage,
    meta:      {
      product: YOUR_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    },
  },
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
    path:      `/${ YOUR_PRODUCT_NAME }/c/:cluster/:resource/:namespace/:id`,
    component: ViewNamespacedResource,
    meta:      {
      product: YOUR_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    },
  }
];

export default routes;
```

> Note: Notice that we didn't need to define the parameter `resource` under `meta`? Since it is a wildcard parameter on the path and it's not mandatory like `cluster` for a top-level product, we don't need to define it on the routes definition.

On the above routes definition for `YOUR_K8S_RESOURCE_NAME` the user will get the default list view automatically wired in to display the list of `YOUR_K8S_RESOURCE_NAME` instances (`${ YOUR_PRODUCT_NAME }-c-cluster-resource`).

The remaining routes will ensure that all the necessary connections are done for create/edit views, but they will not provide any interfaces for those view types! Those will have to be created by the developer and placed on folders with the correct naming in order to make them work. (`edit`, `detail` folders).

Let's then look at an example of this:

```ts
const YOUR_K8S_RESOURCE_NAME = 'your-custom-crd-name';
```

If a user wishes to create custom views for the resource `your-custom-crd-name`, there are three types to consider: `list`, `detail`, and `edit`.

For a `list` view, follow these steps:

1. Create a folder named `list` inside your extension folder.
2. Inside the `list` folder, create a file named `your-custom-crd-name.vue` for the Vue component.

For a `detail` view, follow these steps:

1. Create a folder named `detail` inside your extension folder.
2. Inside the `detail` folder, create a file named `your-custom-crd-name.vue` for the Vue component.

For an `edit` view (which can also serve as a create view), follow these steps:

1. Create a folder named `edit` inside your extension folder.
2. Inside the `edit` folder, create a file named `your-custom-crd-name.vue` for the Vue component.

> Note: The `edit` view can also be used as a `detail` view if you prefer not to duplicate it.

By adhering to this pattern, Rancher Dashboard will automatically take care of the wiring for you, ensuring a seamless experience for all three view types.

The routing definition on this example for `/routing/extension-routing.ts` is based on Vue Router. Don't forget to check the official documentation [here](https://router.vuejs.org/guide/).



## Routes definitions for an Extension as a cluster-level product
Routes definitions start very similar as a top-level product with the `index.ts` in your root folder, where you define your extension configuration, you can just use the `addRoutes` extension method, such as:

```ts
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

  // => => => Add Vue Routes
  plugin.addRoutes(extensionRouting);
}
```

For a Cluster-level product, let's then take into consideration the following example a of `product.ts` config:

```ts
import { IPlugin } from '@shell/core/types';

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
      name: `c-cluster-${ YOUR_PRODUCT_NAME }-${ CUSTOM_PAGE_NAME }`,
      params: {
        product: YOUR_PRODUCT_NAME
      },
      meta: {
        product: YOUR_PRODUCT_NAME
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
      name: `c-cluster-${ YOUR_PRODUCT_NAME }-resource`,
      params: {
        product: YOUR_PRODUCT_NAME,
        resource: YOUR_K8S_RESOURCE_NAME
      },
      meta: {
        product: YOUR_PRODUCT_NAME
      }
    }
  });

  

  // creating a custom page
  virtualType({
    labelKey: 'some.translation.key',
    name:     CUSTOM_PAGE_NAME,
    route:    {
      name:   `c-cluster-${ YOUR_PRODUCT_NAME }-${ CUSTOM_PAGE_NAME }`,
      params: {
        product: YOUR_PRODUCT_NAME
      },
      meta: {
        product: YOUR_PRODUCT_NAME
      }
    }
  });

  // => => => registering the defined pages as side-menu entries
  basicType([YOUR_K8S_RESOURCE_NAME, CUSTOM_PAGE_NAME]);
}
```

In the above example we are registering 2 pages: a resource page called `YOUR_K8S_RESOURCE_NAME` and a custom page called `CUSTOM_PAGE_NAME`. These need to be reflected in the routes definition that is provided to the `addRoutes` method.

Please note that for a Cluster-level product, routing follows a defined pattern:

```js
route: {
   name:   `c-cluster-${ YOUR_PRODUCT_NAME }-${ CUSTOM_PAGE_NAME }`,
   params: { product: YOUR_PRODUCT_NAME }
}
```

Within the params property, we do not define the cluster parameter as this is provided by the context in which cluster the user is currently browsing.

This pattern is a very important aspect for Cluster-level products that you should be mindful at all times when creating a product of this type.

Considering the above, `/routing/extension-routing.ts` would then have to be defined like:

```ts
// custom pages should be created as VueJS components. Usually stored on the /pages folder on the extension
import MyCustomPage from '../pages/myCustomPage.vue';

// to achieve naming consistency throughout the extension
// we recommend this to be defined on a config file and exported
// so that the developer can import it wherever it needs to be used
const YOUR_PRODUCT_NAME = 'myProductName';
const CUSTOM_PAGE_NAME = 'page1';

const routes = [
  // this is an example of a custom page if you wanted to register one
  {
    name:      `c-cluster-${ YOUR_PRODUCT_NAME }-${ CUSTOM_PAGE_NAME }`,
    path:      `/c/:cluster/${ YOUR_PRODUCT_NAME }/${ CUSTOM_PAGE_NAME }`,
    component: MyCustomPage,
    meta:      {
      product: YOUR_PRODUCT_NAME
    }
  }
];

export default routes;
```

> Note: the `meta` parameter is mandatory in order for the routes to work properly!

On the above example, we are registering the route for our custom page called `CUSTOM_PAGE_NAME`. At this point we are still missing the route for `YOUR_K8S_RESOURCE_NAME`, which we will cover next. 

Just to reinforce the message, it is imperative that the `name` and `path` follow this convention needed for Extension cluster-level products as well.

As you can see, we've added a `meta` parameter with the product name. This is necessary to exist on the routes definition in order to ensure that all the wiring "under the hood" is handled correctly by Rancher Dashboard.

Now, for a resource page like `YOUR_K8S_RESOURCE_NAME`, one can leverage the usage of the default components for a list/create/edit routes used on Rancher Dashboard in such a way:

```ts
import MyCustomPage from '../pages/myCustomPage.vue';
import ListResource from '@shell/pages/c/_cluster/_product/_resource/index.vue';
import CreateResource from '@shell/pages/c/_cluster/_product/_resource/create.vue';
import ViewResource from '@shell/pages/c/_cluster/_product/_resource/_id.vue';
import ViewNamespacedResource from '@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue';

// to achieve naming consistency throughout the extension
// we recommend this to be defined on a config file and exported
// so that the developer can import it wherever it needs to be used
const YOUR_PRODUCT_NAME = 'myProductName';
const CUSTOM_PAGE_NAME = 'page1';

const routes = [
  {
    name:      `c-cluster-${ YOUR_PRODUCT_NAME }-${ CUSTOM_PAGE_NAME }`,
    path:      `/c/:cluster/${ YOUR_PRODUCT_NAME }/${ CUSTOM_PAGE_NAME }`,
    component: MyCustomPage,
    meta:      {
      product: YOUR_PRODUCT_NAME
    },
  },
  {
    name:      `c-cluster-${ YOUR_PRODUCT_NAME }-resource`,
    path:      `/c/:cluster/${ YOUR_PRODUCT_NAME }/:resource`,
    component: ListResource,
    meta:      {
      product: YOUR_PRODUCT_NAME
    },
  },
  {
    name:      `c-cluster-${ YOUR_PRODUCT_NAME }-resource-create`,
    path:      `/c/:cluster/${ YOUR_PRODUCT_NAME }/:resource/create`,
    component: CreateResource,
    meta:      {
      product: YOUR_PRODUCT_NAME
    },
  },
  {
    name:      `c-cluster-${ YOUR_PRODUCT_NAME }-resource-id`,
    path:      `/c/:cluster/${ YOUR_PRODUCT_NAME }/:resource/:id`,
    component: ViewResource,
    meta:      {
      product: YOUR_PRODUCT_NAME
    },
  },
  {
    name:      `c-cluster-${ YOUR_PRODUCT_NAME }-resource-namespace-id`,
    path:      `/c/:cluster/${ YOUR_PRODUCT_NAME }/:resource/:namespace/:id`,
    component: ViewNamespacedResource,
    meta:      {
      product: YOUR_PRODUCT_NAME
    },
  }
];

export default routes;
```

On the above routes definition for `YOUR_K8S_RESOURCE_NAME` the user will get the default list view automatically wired in to display the list of `YOUR_K8S_RESOURCE_NAME` instances (`c-cluster-${ YOUR_PRODUCT_NAME }-resource`).

The remaining routes will ensure that all the necessary connections are done for create/edit views, but they will not provide any interfaces for those view types! Those will have to be created by the developer and placed on folders with the correct naming in order to make them work. (`edit`, `detail` folders).

Let's then look at an example of this:

```ts
const YOUR_K8S_RESOURCE_NAME = 'your-custom-crd-name';
```

If a user wishes to create custom views for the resource `your-custom-crd-name`, there are three types to consider: `list`, `detail`, and `edit`.

For a `list` view, follow these steps:

1. Create a folder named `list` inside your extension folder.
2. Inside the `list` folder, create a file named `your-custom-crd-name.vue` for the Vue component.

For a `detail` view, follow these steps:

1. Create a folder named `detail` inside your extension folder.
2. Inside the `detail` folder, create a file named `your-custom-crd-name.vue` for the Vue component.

For an `edit` view (which can also serve as a create view), follow these steps:

1. Create a folder named `edit` inside your extension folder.
2. Inside the `edit` folder, create a file named `your-custom-crd-name.vue` for the Vue component.

> Note: The `edit` view can also be used as a `detail` view if you prefer not to duplicate it.

By adhering to this pattern, Rancher Dashboard will automatically take care of the wiring for you, ensuring a seamless experience for all three view types.

The routing definition on this example for `/routing/extension-routing.ts` is based on Vue Router. Don't forget to check the official documentation [here](https://router.vuejs.org/guide/).
