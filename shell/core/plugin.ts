import { RouteConfig } from 'vue-router';
import { DSL as STORE_DSL } from '@shell/store/type-map';
import { IPlugin } from './types';
import coreStore, { coreStoreModule, coreStoreState } from '@/shell/plugins/core-store';
import {
  RegisterStore, UnregisterStore, CoreStoreSpecifics, CoreStoreConfig, OnNavToPackage, OnNavAwayFromPackage, OnLogOut
} from '@/shell/core/types';

export class Plugin implements IPlugin {
  public id: string;
  public name: string;
  public types: any = {};
  public i18n: { [key: string]: Function[] } = {};
  public locales: { locale: string, label: string}[] = [];
  public products: Function[] = [];
  public productNames: string[] = [];
  public routes: { parent?: string, route: RouteConfig }[] = [];
  public stores: { storeName: string, register: RegisterStore, unregister: UnregisterStore }[] = [];
  public onEnter: OnNavToPackage = () => Promise.resolve();
  public onLeave: OnNavAwayFromPackage = () => Promise.resolve();
  public onLogOut: OnLogOut = () => Promise.resolve();

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

  addI18n(locale: string, fn: Function) {
    this.register('i18n', locale, fn);
  }

  addRoute(parentOrRoute: RouteConfig | string, optionalRoute?: RouteConfig): void {
    // Always add the pkg name to the route metadata
    const parent: string | undefined = typeof (parentOrRoute) === 'string' ? parentOrRoute as string : undefined;
    const route: RouteConfig = typeof (parentOrRoute) === 'string' ? optionalRoute as RouteConfig : parentOrRoute as RouteConfig;

    route.meta = {
      ...route?.meta,
      pkg: this.name,
    };

    this.routes.push({ parent, route });
  }

  addUninstallHook(hook: Function) {
    this.uninstallHooks.push(hook);
  }

  addStore(storeName: string, register: RegisterStore, unregister: UnregisterStore) {
    this.stores.push({
      storeName, register, unregister
    });
  }

  addCoreStore(storeName: string, storeSpecifics: CoreStoreSpecifics, config: CoreStoreConfig) {
    this.stores.push({
      storeName,
      register: () => {
        return coreStore(
          this.storeFactory(storeSpecifics, config),
          config,
        );
      },
      unregister: (store: any) => {
        store.unregisterModule(storeName);
      }
    });
  }

  private storeFactory(storeSpecifics: CoreStoreSpecifics, config: CoreStoreConfig) {
    return {
      ...coreStoreModule,

      state() {
        return {
          ...coreStoreState(config.namespace, config.baseUrl, config.isClusterStore),
          ...storeSpecifics.state()
        };
      },

      getters: {
        ...coreStoreModule.getters,
        ...storeSpecifics.getters
      },

      mutations: {
        ...coreStoreModule.mutations,
        ...storeSpecifics.mutations
      },

      actions: {
        ...coreStoreModule.actions,
        ...storeSpecifics.actions
      },
    };
  }

  public addNavHooks(
    onEnter: OnNavToPackage = () => Promise.resolve(),
    onLeave: OnNavAwayFromPackage = () => Promise.resolve(),
    onLogOut: OnLogOut = () => Promise.resolve(),
  ): void {
    this.onEnter = onEnter;
    this.onLeave = onLeave;
    this.onLogOut = onLogOut;
  }

  public register(type: string, name: string, fn: Function) {
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
