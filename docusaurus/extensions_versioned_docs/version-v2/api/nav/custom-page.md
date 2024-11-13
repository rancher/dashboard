# Custom page

## Defining a custom page for an Extension (virtualType)
As we've seen from the previous chapter, a developer can register a top-level product with the `product` function. How about adding a custom page to your extension product? To do that, we can use the function `virtualType` coming from `$plugin.DSL`. As an example usage of that method, one could do the following:

```ts
import { IPlugin } from '@shell/core/types';

// this is the definition of a "blank cluster" for Rancher Dashboard
// definition of a "blank cluster" in Rancher Dashboard
const BLANK_CLUSTER = '_';


export function init($plugin: IPlugin, store: any) {
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
      name:   `${ YOUR_PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME }`,
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
