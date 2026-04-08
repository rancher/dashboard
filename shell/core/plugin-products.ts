import { IExtension } from '@shell/core/types';
import {
  StandardProductName, ProductChild,
  ProductMetadata, ProductSinglePage,
} from '@shell/core/plugin-types';
import { BasePluginProduct } from '@shell/core/plugin-products-base';
import { TopLevelPluginProduct } from '@shell/core/plugin-products-top-level';
import { ExtendingPluginProduct } from '@shell/core/plugin-products-extending';

/**
 * Factory class for creating plugin products
 * Maintains backward compatibility with the original PluginProduct class
 * @internal
 */
export class PluginProduct {
  private instance: BasePluginProduct;

  constructor(plugin: IExtension, product: StandardProductName | string | ProductMetadata | ProductSinglePage, config: ProductChild[]) {
    if (typeof product === 'object' && product.name) {
      // This is a new product being added
      this.instance = new TopLevelPluginProduct(plugin, product, config);
    } else if (typeof product === 'string') {
      // This is extending an existing standard product
      this.instance = new ExtendingPluginProduct(plugin, product, config);
    } else {
      // at this point we may not know the product name
      throw new Error('Extensions product registration error ::: Invalid product');
    }
  }

  /**
   * Convenience/bridge method: create a new top-level product from just a name string.
   * The product will use EmptyProductPage as its default page.
   */
  static fromName(plugin: IExtension, productName: string): PluginProduct {
    const instance = Object.create(PluginProduct.prototype);

    instance.instance = new TopLevelPluginProduct(plugin, productName, []);

    return instance;
  }

  apply(plugin: IExtension, store: any): void {
    this.instance.apply(plugin, store);
  }

  get newProduct(): boolean {
    return this.instance.isNewProduct;
  }
}
