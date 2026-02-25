import { IExtension } from '@shell/core/types';
import { ProductChild, StandardProductName, StandardProductNames } from '@shell/core/plugin-types';
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

  constructor(plugin: IExtension, productName: StandardProductName, config: ProductChild[]) {
    super(config);

    // Check if the string exists as a VALUE in the standard products
    const isProductValid = Object.values(StandardProductNames).includes(productName);

    if (!isProductValid) {
      throw new Error('Invalid product name');
    }

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
}
