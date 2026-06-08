import { IExtension } from '@shell/core/types';
import EmptyProductPage from '@shell/components/EmptyProductPage.vue';
import pluginProductsHelpers from '@shell/core/plugin-products-helpers';
import { BasePluginProduct } from '@shell/core/plugin-products-base';
import { isProductSinglePage } from '@shell/core/plugin-products-type-guards';
import { ProductChild } from '@shell/core/plugin-products-external';
import { ProductOptions, ProductOptionsSinglePage } from '@shell/core/plugin-products-internal';

/**
 * Represents a new top-level product being added by an extension
 * @internal
 */
export class TopLevelPluginProduct extends BasePluginProduct {
  protected product?: ProductOptions | ProductOptionsSinglePage;

  get isNewProduct(): boolean {
    return true;
  }

  constructor(plugin: IExtension, product: ProductOptions | ProductOptionsSinglePage | string, pages: ProductChild[]) {
    super(pages);

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

    // register the product as a top-level product in the plugin object (will be needed for routes correction when on list views for top-level products)
    plugin._registerTopLevelProduct();

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
