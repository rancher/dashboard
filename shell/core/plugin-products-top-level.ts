import { IExtension } from '@shell/core/types';
import { ProductChild, ProductMetadata, ProductSinglePage } from '@shell/core/plugin-types';
import EmptyProductPage from '@shell/components/EmptyProductPage.vue';
import pluginProductsHelpers from '@shell/core/plugin-products-helpers';
import { BasePluginProduct } from '@shell/core/plugin-products-base';
import { isProductSinglePage } from '@shell/core/plugin-products-type-guards';

/**
 * Represents a new top-level product being added by an extension
 * @internal
 */
export class TopLevelPluginProduct extends BasePluginProduct {
  get isNewProduct(): boolean {
    return true;
  }

  constructor(plugin: IExtension, product: ProductMetadata | ProductSinglePage | string, config: ProductChild[]) {
    super(config);

    // Convenience/bridge method: create a basic product from just a name string
    if (typeof product === 'string') {
      product = {
        name:  product,
        label: product,
      };
    }

    let prodName = product.name;

    // the goal here is not to interfere with vue-router route names, which use dashes
    if (prodName.includes('-')) {
      prodName = prodName.replaceAll('-', '');
    }

    // convert this to "string" to match all types moving forward
    // doesn't impact anything, fixes build problems of extensions
    // and allows extensions to use either string literal or enum value for product name
    this.name = prodName;
    this.product = product;

    // If the product doesn't explicitly set startRouteWithProduct to false, we want the route to start with the product name (e.g. "my-product/c/:cluster/:resource" vs "c/:cluster/my-product/:resource")
    // this is needed for top-level products that have list views with cluster and resource params, to avoid route conflicts with other products that might have the same resource types in their list views
    this.startRouteWithProduct = product.startRouteWithProduct ?? true;

    // register the product as a top-level product in the plugin object (will be needed for routes correction when on list views for top-level products)
    plugin._registerTopLevelProduct();

    // if the product has a `startRouteWithProduct` field, we need to set it on the plugin so that the route correction logic
    // in plugin-products-helpers can work properly for list view routes of top-level products
    plugin._setStartRouteWithProduct(this.startRouteWithProduct);

    this.processConfigChildren();

    // If the product has a `component` field, then this is a single page product
    if (isProductSinglePage(product)) {
      // Add the route to vue-router (here we go with the 'plain' layout for simple single page products)
      const route = pluginProductsHelpers.generateTopLevelExtensionSimpleBaseRoute(this.name, { component: product.component });

      plugin.addRoute('plain', route);
    } else if (this.config.length === 0) {
      // If no config is provided, add a default empty page
      this.config = [{
        name:      'main',
        label:     'Main',
        component: EmptyProductPage,
      }];

      this.addRoutes(plugin, this.name, this.config);
    } else {
      // This is the general case - product with config items and no single page component
      this.addRoutes(plugin, this.name, this.config);
    }
  }
}
