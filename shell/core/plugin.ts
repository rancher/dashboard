import { Plugin } from './types';

export class PluginMetadata implements Plugin {
  public name: string;
  public types: any = {};
  public i18n: any = {};
  public locales: any = [];
  public products: any = [];

  // Plugin metadata (plugin package.json)
  public metadata: any = {};

  constructor(name: string) {
    this.name = name;
  }

  addProduct(product: Function): void {
    this.products.push(product);
  }

  addLocale(locale: string, label: string): void {
    this.locales.push({ locale, label });
  }

  register(type: string, name: string, fn: Function) {
    // Accumulate i18n resources rather than replace
    if (type === 'i18n') {
      if (!this.i18n[name]) {
        this.i18n[name] = [];
      }

      this.i18n[name].push(fn);
    } else {
      if (!this.types[type]) {
        this.types[type] = {};
      }
      this.types[type][name] = fn;
    }
  }
}
