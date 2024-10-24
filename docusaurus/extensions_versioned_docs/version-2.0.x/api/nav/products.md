# Products

A product is a top-level view in Rancher. A product typically adds a navigation entry into the
top-level slide-in menu in Rancher. When the user navigates to the link, the product renders
the entire view beneath the header bar.

Products typically declare their navigation such that it is presented on the left-hand side, e.g.

## Registering a Product

Defining a product leverages the `addProduct` extension method, which should be defined on the `index.ts` on your root folder:

```ts
import { IPlugin } from '@shell/core/types';

// Init the package
export default function(plugin: IPlugin) {
  // ....

  // ... provide metadata

  // Load a product
  plugin.addProduct(require('./product'));
}
```

The `addProduct` method registers a module which will be invoked by Rancher at the
appropriate point in its lifecycle to create the product.

You can register more than one product in an extension.

## Product Definition

The module registered via `addProduct` must export an `init` method. This is invoked with two parameters;

- The `$plugin` API
- The VueX store

### Creating a product

An example `init` function for creating a new product is shown below:

```ts
import { IPlugin } from '@shell/core/types';

export function init($plugin: IPlugin, store: any) {
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
The function `product` comes from `$plugin.DSL` will add your extension to the top-level slide-in menu.

> Note: `plugin.DSL` is called with the store and your product name and returns a number of functions to add and configure products and navigation. The example above shows the use of the `product` function


The allowed parameters for the `product` function are:

| Key | Type | Description |
| --- | --- | --- |
| `icon` | String | icon name (based on [rancher icons](https://rancher.github.io/icons/)) |
| `svg` | Module | SVG icon (alernative to above). Typically use the `require` method with a path of an SVG file|
| `inStore` | String |  Which store should the product be registered on. Use `management` for a top-level product and `cluster` for a cluster-level product |
| `weight` | Int |  Side menu ordering (bigger number on top) |
| `to` | [Vue Router route config](https://v3.router.vuejs.org/api/#routes) |  Route to where the click on the product top-level menu should lead to |
