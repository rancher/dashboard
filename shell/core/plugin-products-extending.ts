import { IExtension } from '@shell/core/types';
import { ProductChild, StandardProductName } from '@shell/core/plugin-types';
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

  constructor(plugin: IExtension, productName: StandardProductName | string, config: ProductChild[]) {
    super(config);

    // existing standard product - no need to add routes
    this.name = productName;

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

    this.addRoutes(plugin, this.name, this.config);
  }

  apply(plugin: IExtension, store: any): void {
    const isRegistered = store.getters['type-map/isProductRegistered'](this.name);

    if (!isRegistered) {
      this.surfaceError(`Product "${ this.name }" is not registered. You can only extend core Dashboard products or builtin extensions.`);
    }

    super.apply(plugin, store);
  }
}
