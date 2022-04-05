import { RouteConfig } from 'vue-router';
import { DSL as STORE_DSL } from '@shell/store/type-map';
import { IPlugin } from './types';

export class Plugin implements IPlugin {
  public id: string;
  public name: string;
  public types: any = {};
  public i18n: { [key: string]: Function[] } = {};
  public locales: { locale: string, label: string}[] = [];
  public products: Function[] = [];
  public productNames: string[] = [];
  public routes: { parent?: string, route: RouteConfig }[] = [];

  // Plugin metadata (plugin package.json)
  public _metadata: any = {};

  // Is this a built-in plugin (bundled with the application)
  public builtin = false;

  // Uninstall hooks
  public uninstallHooks: Function[] = [];

  constructor(id: string) {
    this.id = id;
    this.name = id;
  }

  get metadata() {
    return this._metadata;
  }

  set metadata(value) {
    this._metadata = value;
    this.name = this._metadata.name || this.id;
  }

  // Track which products the plugin creates
  DSL(store: any, productName: string) {
    const storeDSL = STORE_DSL(store, productName);

    this.productNames.push(productName);

    return storeDSL;
  }

  addProduct(product: Function): void {
    this.products.push(product);
  }

  addLocale(locale: string, label: string): void {
    this.locales.push({ locale, label });
  }

  addRoute(parentOrRoute: any, route?: any): void {
    if (typeof (parentOrRoute) === 'string') {
      this.routes.push({ parent: parentOrRoute as string, route });
    } else {
      this.routes.push({ route: parentOrRoute as RouteConfig });
    }
  }

  addUninstallHook(hook: Function) {
    this.uninstallHooks.push(hook);
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
