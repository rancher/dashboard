# Side menu

## Defining a page as a side-menu entry (basicType)

With the `virtualType` and `configureType` we have learned how to configure a page for your Extension product, but that won't make it appear on the side-menu. For that you need to use the function `basicType` coming from `$plugin.DSL`. As an example usage of that method, one could do the following:

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
import { IPlugin } from '@shell/core/types';

// this is the definition of a "blank cluster" for Rancher Dashboard
// definition of a "blank cluster" in Rancher Dashboard
const BLANK_CLUSTER = '_';

export function init($plugin: IPlugin, store: any) {
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
import { IPlugin } from '@shell/core/types';

// this is the definition of a "blank cluster" for Rancher Dashboard
// definition of a "blank cluster" in Rancher Dashboard
const BLANK_CLUSTER = '_';

export function init($plugin: IPlugin, store: any) {
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