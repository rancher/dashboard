import { IProducts, IProduct, ProductOptions } from '@shell/core/types';
import { Product } from './product';

export class Products implements IProducts {
  private store: any;
  private router: any;
  public products:any[] = [];

  constructor(store: any, router: any) {
    this.store = store;
    this.router = router;
  }

  add(name: string, options?: ProductOptions): IProduct {
    const product = new Product(this.store, name, this.router);

    product.create(options);

    this.products.push(product);

    return product;
  }

  /**
   * Get an existing product
   * @param name Product name
   * @returns IProduct interface for the given product or undefined it the product does not exist
   */
  get(name: string): IProduct | undefined {
    const all = this.store.getters['type-map/allProducts'];
    const exists = all.find((p: any) => p.name === name);

    if (exists) {
      const p = new Product(this.store, name, this.router);

      this.products.push(p);

      return p;
    }

    return undefined;
  }
}
