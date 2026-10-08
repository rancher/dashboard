import { IExtension } from '@shell/core/types';
import EmptyProductPage from '@shell/components/EmptyProductPage.vue';
import { BasePluginProduct } from '@shell/core/plugin-products-base';
import { ProductChild, StandardProductName } from '@shell/core/plugin-products-external';
import { AdvancedProductConfigOptionsInternal } from '@shell/core/plugin-products-internal';
import { AddLateRoutes, PluginRouteInfo } from '@shell/core/plugin-types';
import { ExtensionProductRouting, getExtensionProductRouting } from '@shell/core/plugin-products-route-registry';

/**
 * Represents extending an existing standard product
 * @internal
 */
export class ExtendingPluginProduct extends BasePluginProduct {
  /**
   * Was the product being extended in the route registry when the constructor ran? If it was not,
   * the constructor took it for a core product - which may only be because the extension product
   * had not been registered yet. `apply` checks again.
   */
  private parentKnown = false;

  get isNewProduct(): boolean {
    return false;
  }

  constructor(plugin: IExtension, productName: StandardProductName | string, config: ProductChild[], advancedProdConfig?: AdvancedProductConfigOptionsInternal) {
    super(config, advancedProdConfig);

    // How does the product being extended route? Anything an extension registered as a top level
    // product is in the registry; anything else is a core product.
    const normalizedName = this.normalizeProductName(productName);
    const parent = getExtensionProductRouting(normalizedName);

    // `addProduct` stores the name without dashes, so use that name for those products. Leave any
    // other name as passed - products registered through the legacy DSL keep their dashes (e.g.
    // `harvester-manager`).
    this.name = parent ? normalizedName : productName;
    this.parentKnown = !!parent;

    this.useParentRouting(plugin, parent);

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

  /**
   * Match the routing of the product being extended. `parent` is its route registry entry, or
   * `undefined` for a core product.
   */
  private useParentRouting(plugin: IExtension, parent?: ExtensionProductRouting): void {
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
  }

  /**
   * @param addLateRoutes adds routes to vue-router straight away. Needed when the product being
   * extended turns out to be an extension product registered after the constructor ran - see
   * `useLateParentRouting`
   */
  apply(plugin: IExtension, store: any, addLateRoutes?: AddLateRoutes): void {
    // Registered after the constructor ran? Then this is the product's real name, not a core one
    const lateParentName = this.parentKnown ? undefined : this.normalizeProductName(this.name);
    const lateParent = lateParentName ? getExtensionProductRouting(lateParentName) : undefined;

    if (lateParent) {
      this.name = lateParentName as string;
    }

    const product = store.getters['type-map/productByName'](this.name);

    if (!product?.extendable) {
      this.surfaceError(`Product "${ this.name }" is not extendable. You can only extend core Dashboard products or products an extension registered with "extendable: true".`);
    }

    if (lateParent) {
      this.useLateParentRouting(plugin, lateParent, addLateRoutes);
    }

    super.apply(plugin, store);
  }

  /**
   * The constructor runs as soon as the extension calls `extendProduct`. That can be before the
   * product it extends is registered - when `addProduct` is called later in the same extension, or
   * by an extension that loaded later - so it took the product for a core one and generated core
   * routes for its pages. Those routes match nothing the product links to, so generate the ones
   * that match the product's real routing.
   *
   * The extension's routes were handed to vue-router when it loaded, so these have to be added
   * straight away rather than through `plugin.addRoute` alone.
   */
  private useLateParentRouting(plugin: IExtension, parent: ExtensionProductRouting, addLateRoutes?: AddLateRoutes): void {
    this.parentKnown = true;
    this.useParentRouting(plugin, parent);

    // `routes` is on the `Plugin` class but not on the public `IExtension` interface
    const pluginRoutes = (plugin as IExtension & { routes: PluginRouteInfo[] }).routes;
    const firstNewRoute = pluginRoutes.length;

    this.addRoutes(plugin, this.name, this.config);

    addLateRoutes?.(pluginRoutes.slice(firstNewRoute));
  }
}
