import { IExtension } from '@shell/core/types';
import {
  StandardProductName, ProductChild,
  ProductMetadata, ProductSinglePage
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

  constructor(plugin: IExtension, product: StandardProductName | ProductMetadata | ProductSinglePage, config: ProductChild[]) {
    if (typeof product === 'object' && product.name) {
      // This is a new product being added
      this.instance = new TopLevelPluginProduct(plugin, product, config);
    } else if (typeof product === 'string') {
      // This is extending an existing standard product
      this.instance = new ExtendingPluginProduct(plugin, product, config);
    } else {
      throw new Error('Invalid product');
    }
  }

  apply(plugin: IExtension, store: any): void {
    this.instance.apply(plugin, store);
  }

  get newProduct(): boolean {
    return this.instance.isNewProduct;
  }
}
