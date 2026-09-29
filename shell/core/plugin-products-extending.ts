import { IExtension } from '@shell/core/types';
import EmptyProductPage from '@shell/components/EmptyProductPage.vue';
import { BasePluginProduct } from '@shell/core/plugin-products-base';
import { ProductChild, StandardProductName } from '@shell/core/plugin-products-external';
import { AdvancedProductConfigOptionsInternal } from '@shell/core/plugin-products-internal';
import { getExtensionProductRouting } from '@shell/core/plugin-products-route-registry';

/**
 * Represents extending an existing standard product
 * @internal
 */
export class ExtendingPluginProduct extends BasePluginProduct {
  get isNewProduct(): boolean {
    return false;
  }

  constructor(plugin: IExtension, productName: StandardProductName | string, config: ProductChild[], advancedProdConfig?: AdvancedProductConfigOptionsInternal) {
    super(config, advancedProdConfig);

    this.name = productName;

    // How does the product being extended route? Anything an extension registered as a top level
    // product is in the registry; anything else is a core product.
    const parent = getExtensionProductRouting(productName);

    if (parent) {
      // Top level extension products live at `<product>/c/:cluster/...`, which nothing in the core
      // router matches, so match the parent rather than assuming the core routes cover it. They
      // only own the generic `:resource` routes if the product itself registered a resource page,
      // so extending one with its first resource page still has to add them.
      this.startRouteWithProduct = parent.startRouteWithProduct;
      this.extendParentRoutes = false;
      this.registerResourceRoutes = !parent.hasResourceRoutes;

      if (parent.startRouteWithProduct) {
        // `Masthead.vue` and `resource-class.js` resolve the product-prefixed route shape from the
        // last plugin whose `productNames` includes the product - which is this one once it
        // extends. Without this they would fall back to the non-prefixed shape.
        plugin._registerTopLevelProduct(this.name);
      }
    } else {
      // Core product - the core c/:cluster/:product/... routes already cover it, including the
      // generic `:resource` ones, so this registration must not add any of its own.
      this.startRouteWithProduct = false;
      this.extendParentRoutes = true;
      this.registerResourceRoutes = false;
    }

    plugin._setStartRouteWithProduct(this.name, this.startRouteWithProduct);

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
