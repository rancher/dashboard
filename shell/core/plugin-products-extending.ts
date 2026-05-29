import { IExtension } from '@shell/core/types';
import { ProductChild, StandardProductName, AdvancedProductConfigOptions } from '@shell/core/plugin-types';
import EmptyProductPage from '@shell/components/EmptyProductPage.vue';
import { BasePluginProduct } from '@shell/core/plugin-products-base';

/**
 * Represents extending an existing standard product
 * @internal
 */
export class ExtendingPluginProduct extends BasePluginProduct {
  get isNewProduct(): boolean {
    return false;
  }

  constructor(plugin: IExtension, productName: StandardProductName | string, config: ProductChild[], advancedProdConfig?: AdvancedProductConfigOptions) {
    super(config, advancedProdConfig);

    // existing standard product - no need to add routes
    this.name = productName;
    this.startRouteWithProduct = false;
    plugin._setStartRouteWithProduct(false);

    if (this.config?.length > 0) {
      this.processConfigChildren();
    } else {
      // If no config is provided, add a default empty page
      this.config = [{
        name:      'main',
        label:     'Main',
        component: EmptyProductPage,
      }];
    }

    // the productRouteOverride option allows extensions to specify a custom route name for their extension pages,
    // which is necessary in cases where the extension is adding pages to a product that has existing pages (ex: cluster explorer apps),
    // to avoid route name conflicts between the extension's pages and the core product's pages
    this.addRoutes(plugin, this.name, this.config);
  }

  apply(plugin: IExtension, store: any): void {
    const product = store.getters['type-map/productByName'](this.name);

    if (!product?.extendable) {
      this.surfaceError(`Product "${ this.name }" is not extendable. You can only extend core Dashboard products or builtin extensions.`);
    }

    super.apply(plugin, store);
  }
}
