# Concepts

## Overview on routing structure for Rancher Dashboard

To become familiar with routing on VueJS and route definition we recommend that you should give a read about the [Essentials on Vue Router](https://v3.router.vuejs.org/guide/) and also the definition of a [Vue Router route](https://v3.router.vuejs.org/api/#routes).

Rancher Dashboard follows a specific route pattern that needs to be fulfilled in order for Extensions to work properly with the current overall logic of the application. That pattern needs on the url path to include which `product` we are trying to load and which `cluster` we are using.

As example of an existing route, say the Fleet product, let's look at the current url structure for it:

```ts
<-YOUR-RANCHER-INSTANCE-BASE-URL->/c/_/fleet
```

In terms of the route definition (Vue Router), we would translate this url to:

```ts
const clusterManagerRoute = {
  name: 'c-cluster-product',
  path: 'c/:cluster/:product',
  params: {
    cluster: '_',
    product: 'fleet'
  },
  meta: {
    cluster: '_',
    product: 'fleet'
  }
}
```

As we can see from the example above, we have defined on the `path` the wildcards for `cluster` and `product`. Also we can see the definition of `params` property, which is needed for internal app navigation and where we define the `cluster` value as `_` , which in terms of the app context this means that we are using a "blank cluster" which translates that the app doesn't need to care about the cluster context for the Fleet product to run. Also we are defining `product` value as `fleet`, which in turn tells the app  what is the correct product to load.

With this pattern of wildcards and `params` in mind, then how does the route structure should look like for a top-level Extension product? In short, it needs to follow this pattern:

```ts
const YOUR_EXT_PRODUCT_NAME = 'myExtension';

const baseRouteForATopLevelProduct = {
  name: `${ YOUR_EXT_PRODUCT_NAME }-c-cluster`,
  path: `/${ YOUR_EXT_PRODUCT_NAME }/c/:cluster`,
  params: {
    cluster: '_',
    product: YOUR_EXT_PRODUCT_NAME
  },
  meta: {
    cluster: '_',
    product: YOUR_EXT_PRODUCT_NAME
  }
}
```

As we can see we have dismissed the `product` wildcard on the `path` and replaced it with the Extension product name to make it unique. With the `product` param we make sure that the is taken to the correct product at all time.
This structure on the above example ensures that all the wiring needed for the Extension to work properly on Rancher Dashboard is done. There's even the case where the wildcard `resource` needs to be defined in order to display information about Kubernetes resources or custom CRDs. An example of a resource route in a top-level Extension product would be:

```ts
const YOUR_EXT_PRODUCT_NAME = 'myExtension';
const RESOURCE_NAME = 'my-resource-name';

const routeForATopLevelProductResource = {
  name: `${ YOUR_EXT_PRODUCT_NAME }-c-cluster-resource`,
  path: `/${ YOUR_EXT_PRODUCT_NAME }/c/:cluster/:resource`,
  params: {
    cluster: '_',
    product: YOUR_EXT_PRODUCT_NAME
    resource: RESOURCE_NAME
  },
  meta: {
    cluster: '_',
    product: YOUR_EXT_PRODUCT_NAME
  }
}
```

With this overview on how routing works in Rancher Dashboard, we should be ready to cover the registration of custom pages, resource pages and general route definition. For more detailed information on **top-level product routing**, check this page [here](./nav/routing.md#routes-definition-for-an-extension-as-a-top-level-product).

If you are interested in **cluster-level product routing**, check this page [here](./nav/routing.md#routes-definition-for-an-extension-as-a-cluster-level-product).

