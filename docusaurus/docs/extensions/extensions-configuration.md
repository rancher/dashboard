# Extensions configuration

Follow instructions [here](./extensions-getting-started.md) to scaffold your extension. This will assist you in the creation of an extension as a top-level product inside Rancher Dashboard.

Once you've done so, there are some initialization steps specific to extensions. Beyond that, extensions largely work the same as the rest of the dashboard. There are a set of top-level folders that can be defined and used as they are in the dashboard: `chart`, `cloud-credential`, `content`, `detail`, `edit`, `list`, `machine-config`, `models`, `promptRemove`, `l10n`, `windowComponents`, `dialog`, and `formatters`. You can read about what each of these folders does [here](../code-base-works/directory-structure.md).

## Defining an Extension information/description

When setting up a extension, on the Extensions part of Rancher Dashboard you will find information regarding the extension:

![Product Information](./screenshots/product-information.png)

Which will come from two separate places: the extension initialization and a README file on the root folder of your extension.

The extension initialization should contain the `metadata` extension method to grab fields such as `name` and `description`:

```ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide extension metadata from package.json
  plugin.metadata = require('./package.json');
}
```

And if you add a `README.md` file to your extension root folder, it will populate the `detail` portion of the product description.

## Defining an Extension as a top-level product (product)

Defining an extension as product leverages the `addProduct` extension method, which will be defined on the `index.ts` on your root folder:

```ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide extension metadata from package.json
  // it will grab information such as `name` and `description`
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./product'));
}
```

But as for a basic example of a product definition of your extension on your `product.ts` file would be something along these lines:

```ts
export function init($plugin, store) {
  const YOUR_PRODUCT_NAME = 'myProductName';
  
  const { product } = $plugin.DSL(store, YOUR_PRODUCT_NAME);

  product({
    icon: 'gear',
    inStore: 'management',
    weight: 100,
    to: // this will the route path that will be your entry point for this product
  });
}
```
The function `product` coming from `$plugin.DSL` will add your extension to the top-level slide-in menu.

The acceptable parameters for the `product` function are defined here:

| Key | Type | Description |
| --- | --- | --- |
| `icon` | String | icon name (based on [rancher icons](https://rancher.github.io/icons/)) |
| `inStore` | String |  Where to navigate when the upper-left logo is clicked |
| `weight` | Int |  Side menu ordering (bigger number on top) |
| `to` | [Vue Router route config](https://v3.router.vuejs.org/api/#routes) |  Route to where the click on the product top-level menu should lead to |

## Overview on routing structure for a top-level Extension product

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
  }
}
```

With this quick guide on routing for top-level Extension products, we should be ready to cover the registration of custom pages, resource pages and general route definition. 


## Defining a custom page for an Extension (virtualType)
As we've seen from the previous example, a developer can register a top-level product with the `product` function. How about adding a custom page to your extension product? To do that, we can use the function `virtualType` coming from `$plugin.DSL`. As an example usage of that method, one could do the following:

```ts
// this is the definition of a "blank cluster" for Rancher Dashboard
import { BLANK_CLUSTER } from '@shell/store';

export function init($plugin, store) {
  const YOUR_PRODUCT_NAME = 'myProductName';
  const CUSTOM_PAGE_NAME = 'page1';
  
  const { 
    product,
    virtualType
  } = $plugin.DSL(store, YOUR_PRODUCT_NAME);

  // registering a top-level product
  product({
    icon: 'gear',
    inStore: 'management',
    weight: 100,
    to: { // this is the entry route for the Extension product, which is registered below
      name: `${ YOUR_PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME }`,
      params: {
        product: YOUR_PRODUCT_NAME,
        cluster: BLANK_CLUSTER
      }
    }
  });

  // => => => creating a custom page
  virtualType({
    labelKey: 'some.translation.key',
    name:     CUSTOM_PAGE_NAME,
    route:    {
      name:   `${ PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME }`,
      params: {
        product: YOUR_PRODUCT_NAME,
        cluster: BLANK_CLUSTER
      }
    }
  });
}
```

With the route definition in the router (check the [Extension Routing](#routes-definition-for-an-extension-as-a-top-level-product)) chapter, you can define which Vue component will be loaded as a custom page. That will act as a "blank canvas" to render anything you want.

The acceptable parameters for the `virtualType` function are defined here:

| Key | Type | Description |
| --- | --- | --- |
|`name`| String | Page name (should be unique) |
|`label`| String | side-menu label for this page |
|`labelKey`| String | Same as "label" but allows for translation. Will superseed "label" |
| `icon` | [String | icon name (based on [rancher icons](https://rancher.github.io/icons/)) |
| `weight` | Int |  Side menu ordering (bigger number on top) |
| `route` | [Vue Router route config](https://v3.router.vuejs.org/api/#routes) |  Route for this custom page |

> Note: If no `label` or `labelKey` is set, then the side-menu label will be the `name` field

## Defining a kubernetes resource as a page for an Extension (configureType)
One of the most common view types in Rancher Dashboard is the list view for a kubernetes resource. What if you wanted to include a similiar view on your Extension product for a given resource? For that we can use the function `configureType` coming from `$plugin.DSL`. As an example usage of that method, one could do the following:

```ts
// this is the definition of a "blank cluster" for Rancher Dashboard
import { BLANK_CLUSTER } from '@shell/store';

export function init($plugin, store) {
  const YOUR_PRODUCT_NAME = 'myProductName';
  // example of using an existing k8s resource as a page
  const YOUR_K8S_RESOURCE_NAME = 'provisioning.cattle.io.cluster';
  
  const { 
    product,
    configureType
  } = $plugin.DSL(store, YOUR_PRODUCT_NAME);

  // registering a top-level product
  product({
    icon: 'gear',
    inStore: 'management',
    weight: 100,
    to: {
      name: `${ YOUR_PRODUCT_NAME }-c-cluster-resource`,
      params: {
        product: YOUR_PRODUCT_NAME,
        cluster: BLANK_CLUSTER,
        resource: YOUR_K8S_RESOURCE_NAME
      }
    }
  });

  // => => => defining a k8s resource as page
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
}
```

> Note: We strongly encourange the usage of the `customRoute` to make sure we follow the same route structure as the other routes on the same Extension product. Check pattern [here](#overview-on-routing-structure-for-a-top-level-extension-product).

The acceptable parameters for the `configureType` function are defined here:

| Key | Type | Description |
| --- | --- | --- |
|`displayName`| String | Display name for the given resource. Defaults to `YOUR_K8S_RESOURCE_NAME` (based on example) if you haven't defined a `displayName`  |
|`isCreatable`| Boolean | If the 'create' button is available on the list view |
|`isEditable`| Boolean | If a resource instance is editable |
|`isRemovable`| Boolean | If a resource instance is deletable |
|`showAge`| Boolean | If the 'age' column is available on the list view |
|`showState`| Boolean | If the 'state' column is available on the list view |
|`canYaml`| Boolean | If the k8s resource can be edited/created via YAML editor |
| `customRoute` | [Vue Router route config](https://v3.router.vuejs.org/api/#routes) |  Route for this resource page |

## Defining a page as a side-menu entry (basicType)

With the `virtualType` and `configureType` we have learned how to configure a page for your Extension product, but that won't make it appear on the side-menu. For that you need to use the function `basicType` coming from `$plugin.DSL`. As an example usage of that method, one could do the following:

```ts
// this is the definition of a "blank cluster" for Rancher Dashboard
import { BLANK_CLUSTER } from '@shell/store';

export function init($plugin, store) {
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
      name:   `${ PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME }`,
      params: {
        product: YOUR_PRODUCT_NAME,
        cluster: BLANK_CLUSTER
      }
    }
  });

  // => => => registering the defined pages as side-menu entries
  basicType([YOUR_K8S_RESOURCE_NAME, CUSTOM_PAGE_NAME]);
}
```

On the above example we are creating two side menu entries on a "root" level for your `YOUR_K8S_RESOURCE_NAME` and `CUSTOM_PAGE_NAME` pages. 

Menu entries can also be grouped under a common "folder/group" in the side menu. For that the `basicType` takes an additional parameter which will be the name for the folder/group" in the side-menu. An example of the grouping as a follow-up on the example above would be: 

```ts
// update of the function usage based on the example above

// => => => registering the defined pages as side-menu entries as a group 
  basicType([YOUR_K8S_RESOURCE_NAME, CUSTOM_PAGE_NAME], 'my-custom-group-name');
```

> NOTE: On the example above the label of the group on the side-menu will be `my-custom-group-name`.

## Side menu ordering (weightType and weightGroup)

How about if you wanted to change the side-menu ordering for your Extension product? That can be achieved by using the functions `weightType` and `weightGroup` coming from `$plugin.DSL`. Let's then look at the following example:

```ts
// this is the definition of a "blank cluster" for Rancher Dashboard
import { BLANK_CLUSTER } from '@shell/store';

export function init($plugin, store) {
  const YOUR_PRODUCT_NAME = 'myProductName';
  const YOUR_K8S_RESOURCE_NAME = 'provisioning.cattle.io.cluster';
  const CUSTOM_PAGE_NAME_1 = 'page1';
  const CUSTOM_PAGE_NAME_2 = 'page2';
  const CUSTOM_PAGE_NAME_3 = 'page3';
  
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
      name: `${ YOUR_PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME_2 }`,
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
}
```

> Note: All individual root elements (in the example would be `CUSTOM_PAGE_NAME_2` and `CUSTOM_PAGE_NAME_3`) are placed under a pseudo-group called `root`, which in turn has always a default weight of `1000`.

In the example provided above we are registering 4 pages: 1 is a "resource" page (`YOUR_K8S_RESOURCE_NAME`) and 3 are "custom" pages (`CUSTOM_PAGE_NAME_1`, `CUSTOM_PAGE_NAME_2` and `CUSTOM_PAGE_NAME_3`). 

These pages are set as side-menu entries being `YOUR_K8S_RESOURCE_NAME` and `CUSTOM_PAGE_NAME_1` in a group called `myAdvancedGroup` and 2 other pages(`CUSTOM_PAGE_NAME_2` and `CUSTOM_PAGE_NAME_3`) as a root level side-menu entry. 

The default ordering of these side-menu entries is the order on which you register them using `basicType`, taking also into consideration pseudo-group `root`, which in turn will always be above any other custom groups, provided the fact that the developer hasn't defined any custom group weight yet.

In the above example the side-menu output would be something like:

* CUSTOM_PAGE_NAME_2
* CUSTOM_PAGE_NAME_3
* myAdvancedGroup
  - YOUR_K8S_RESOURCE_NAME
  - CUSTOM_PAGE_NAME_1

If we wanted to define some custom ordering for these menu entries, we would need to use the functions `weightType` and `weightGroup`, like: 

```ts
// this is the definition of a "blank cluster" for Rancher Dashboard
import { BLANK_CLUSTER } from '@shell/store';

export function init($plugin, store) {
  const YOUR_PRODUCT_NAME = 'myProductName';
  const YOUR_K8S_RESOURCE_NAME = 'provisioning.cattle.io.cluster';
  const CUSTOM_PAGE_NAME_1 = 'page1';
  const CUSTOM_PAGE_NAME_2 = 'page2';
  const CUSTOM_PAGE_NAME_3 = 'page3';
  
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
      name: `${ YOUR_PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME_2 }`,
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

  // => => => individual ordering of each menu entry
  weightType(CUSTOM_PAGE_NAME_1, 2, true);
  weightType(YOUR_K8S_RESOURCE_NAME, 1, true);
  weightType(CUSTOM_PAGE_NAME_3, 2, true);
  weightType(CUSTOM_PAGE_NAME_2, 1, true);

  // => => => ordering of the grouped entry
  weightGroup('myAdvancedGroup', 1001, true);
}
```

Given the example provided above, what would be the output in terms of ordering of this side-menu?
* myAdvancedGroup
  - CUSTOM_PAGE_NAME_1
  - YOUR_K8S_RESOURCE_NAME
* CUSTOM_PAGE_NAME_3
* CUSTOM_PAGE_NAME_2

Interpreting the code on the example, it's easy to follow the ordering defined:
- We are setting 3 root level side-menu items: `CUSTOM_PAGE_NAME_2`, `CUSTOM_PAGE_NAME_3` and `myAdvancedGroup`
- Technically, as mentioned on the note above, `CUSTOM_PAGE_NAME_2` and `CUSTOM_PAGE_NAME_3` are placed under a group called `root` which has no label associated, hence why it's not perceived as "group" like `myAdvancedGroup`
- Since we are giving a weight of `1001` to `myAdvancedGroup` (the bigger, the higher it will sit on the menu ordering - higher than the default `1000` of `root`), the `myAdvancedGroup` menu will be above the `CUSTOM_PAGE_NAME_2` and `CUSTOM_PAGE_NAME_3` side-menu entries
- Inside the `myAdvancedGroup` group we are setting a specific order as well: weight of `2` to `CUSTOM_PAGE_NAME_1` and a weight of `1` to `YOUR_K8S_RESOURCE_NAME`.This will make the side-menu entry for `CUSTOM_PAGE_NAME_1` appear higher than `YOUR_K8S_RESOURCE_NAME` inside the group `myAdvancedGroup`
- As for the `CUSTOM_PAGE_NAME_2` and `CUSTOM_PAGE_NAME_3` they are done inside that virtual group called `root`. Since `CUSTOM_PAGE_NAME_3` is set a weight of `2` and `CUSTOM_PAGE_NAME_3` is set a weight of `1`, `CUSTOM_PAGE_NAME_3` will appear above `CUSTOM_PAGE_NAME_2`

> NOTE: The last parameter for the `weightType` and `weightGroup` functions is a boolean that should be set to `true` at all times so that it works properly.

## Routes definition for an Extension as a top-level product
Extensions should use a `pages` directory, as the shell currently does, but routing needs to be explicitly defined then added in the extension index using the extension `addRoutes` method. Extension routes can override existing dashboard routes: they'll be loaded on extension entry and unloaded (with old dashboard routes re-loaded...) on extension leave. 

As touched on above, cluster and product information used to connect to the cluster and define navigation is determined from the route. Consequently, while extensions have a lot of control over their own routing, anything tied into one kubernetes cluster should be nested in `pages/c/_cluster`.

> Note: All of the routes defined when setting up your Extension product (`product.ts`) need to be defined as routes with the `addRoutes` method.

Within the `index.ts` in your root folder, where you define your extension configuration, you can just use the `addRoutes` extension method, such as:

```ts
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
// this is the definition of a "blank cluster" for Rancher Dashboard
import { BLANK_CLUSTER } from '@shell/store';

export function init($plugin, store) {
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
      name:   `${ PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME }`,
      params: {
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

The `/routing/extension-routing.ts` would then have to defined like:

```ts
// custom pages should be created as VueJS components. Usually stored on the /pages folder on the extension
import { BLANK_CLUSTER } from '@shell/store';
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

Just to reinforce the message, it is imperative that the `name` and `path` follow this convention needed for Extension top-level products, which we cover on this [overview](#overview-on-routing-structure-for-a-top-level-extension-product).

As you can see, we've added a `meta` parameter with the product and cluster names. This is necessary to exist on the routes definition in order to ensure that all the wiring "under the hood" is handled correctly by Rancher Dashboard.

We are still missing a route definition for a resource page like `YOUR_K8S_RESOURCE_NAME`. For this goal one can leverage the usage of the default components for a list/create/edit routes used on Rancher Dashboard in such a way:

```ts
import { BLANK_CLUSTER } from '@shell/store';
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

> Note: Noticed that we didn't need to define the parameter `resource` under `meta`? Since it a wildcarded parameter on the path and it's not mandatory like `cluster`, we don't need to define it on the routes definition.

On the above routes definition for `YOUR_K8S_RESOURCE_NAME` the user will get the default list view automatically wired in to display the list of `YOUR_K8S_RESOURCE_NAME` instances (`${ YOUR_PRODUCT_NAME }-c-cluster-resource`).

The remaining routes will ensure that all the necessary connections are done for create/edit views, but they will not provide any interfaces for those view types! Those will have to be created by the developer and placed on folders with the correct naming in order to make them work.

Let's then look at an example of this:

```ts
const YOUR_K8S_RESOURCE_NAME = 'your-custom-crd-name';
```

if a user wants a custom `list` view for the resource `your-custom-crd-name`, one will need to create a folder called `list` inside your extension folder, and the create file there for a vue component called `your-custom-crd-name.vue`. By following this pattern, Rancher Dashboard will take care of the wiring for you.

For a `detail` view, just create a folder called `detail` inside your extension folder, and the create file there for a vue component called `your-custom-crd-name.vue`.

For an `edit` view, just create a folder called `edit` inside your extension folder, and the create file there for a vue component called `your-custom-crd-name.vue`. The edit will dub as a `create` view also, so no need to add a `create` folder. It can even dub as a `detail` view if you don't wish to duplicate it. 

The routing definition on this example for `/routing/extension-routing.ts` is based on Vue Router. Don't forget to check the official documentation [here](https://router.vuejs.org/guide/).


## Initializing Extension Stores
Extensions should explicitly register any store modules in their `index.ts` by using the `addDashboardStore` extension method. This will also add familiar [Vuex](https://vuex.vuejs.org/) actions for retrieving and classifying resources, details of which can be found in `shell/plugins/dashboard-store/index`.

An example would be to define in the folder `store` of your extension a basic configuration on an `index.ts` file, such as:

```ts
import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';
import getters from './getters'; // this would be your getters file on your extension /store folder
import mutations from './mutations'; // this would be your mutations file on your extension /store folder
import actions from './actions'; // this would be your actions file on your extension /store folder

// to achieve naming consistency throughout the extension
// we recommend this to be defined on a config file and exported
// so that the developer can import it wherever it needs to be used
const YOUR_PRODUCT_NAME = 'the-name-of-your-product';

const yourExtensionFactory = (): CoreStoreSpecifics => {
  return {
    state() {
      return { someStateVariable: '' };
    },

    getters: { ...getters },

    mutations: { ...mutations },

    actions: { ...actions },
  };
};
const config: CoreStoreConfig = { namespace: YOUR_PRODUCT_NAME };

export default {
  specifics: yourExtensionFactory(),
  config
};
```

In the `store` folder you just need to create the `getters.js`, `actions.js` and `mutations.js` files and write up your store code there, based on the convention of [Vuex](https://vuex.vuejs.org/).

And on the `index.ts` on your root folder, where you define your extension configuration, you can just use the `addDashboardStore` extension method, such as:

```ts
import extensionStore from './store';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide extension metadata from package.json
  // it will grab information such as `name` and `description`
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./product'));
  
  // => => => Add Vuex store
  plugin.addDashboardStore(extensionStore.config.namespace, extensionStore.specifics, extensionStore.config);
}
```


Extensions can optionally define their own cluster store module by setting `isClusterStore` in the store index, eg:
```ts
// to achieve naming consistency throughout the extension
// we recommend this to be defined on a config file and exported
// so that the developer can import it wherever it needs to be used
const YOUR_PRODUCT_NAME = 'the-name-of-your-product';

const config: CoreStoreConfig = {
  namespace:      YOUR_PRODUCT_NAME,
  isClusterStore: true
};

export default {
  specifics: harvesterFactory(),
  config,
  init:      steveStoreInit
};
```

This will cause the shell `loadCluster` action to run the extension's `loadCluster` action when entering a package, and the extension store's `unsubscribe` and `reset` when leaving. 


## Navigation In and Out of Extensions
Extensions can define `onEnter` and `onLeave` hooks in their index `addNavHooks` extension method, which will run when the authenticated middleware detects a package change by checking the route meta property. `onEnter` and `onLeave` accept the same props: the vuex store context and a config object containing: 

| Key | Type | Description |
|---|---|---|
|`clusterId`| String | The unique ID of the current cluster, determined by the route's `cluster` param |
|`product`| String | The name of the product being navigated to, also taken from the route |
|`oldProduct`| String | The name of the product being navigated away from |
|`oldIsExt`| Boolean | True if the previous product was in a package (note that this doesn't distinguish between inter- and intra-package product changes) |

The `authenticated` middleware will:
* Connect to the management cluster (`loadManagement`)
* Apply product config, as determined from the route (`applyProducts`)
* If an old extension is loaded, run its `onLeave` hook
* Run `onEnter` hook for new extension 
* Run `loadCluster` (which, as stated above, can run load and unload cluster actions defined in extensions)

An example of the usage `onEnter` and `onLeave` using the `addNavHooks` extension method would be:

```ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin, OnNavToPackage, OnNavAwayFromPackage } from '@shell/core/types';

const onEnter: OnNavToPackage = async(store, config) => {
  // define any function needed here for `onEnter`
};
const onLeave: OnNavAwayFromPackage = async(store, config) => {
  // define any function needed here for `onLeave`
};

// Init the extension
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide extension metadata from package.json
  // it will grab information such as `name` and `description`
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./product'));

  // => => => Add hooks to Vue navigation world
  plugin.addNavHooks(onEnter, onLeave);
}
```