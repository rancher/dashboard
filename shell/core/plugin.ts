/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { RouteRecordRaw } from 'vue-router';
import { DSL as STORE_DSL } from '@shell/store/type-map';
import { _DETAIL } from '@shell/config/query-params';
import {
  CoreStoreInit,
  Action,
  Tab,
  Card,
  Panel,
  TableColumn,
  IPlugin,
  LocationConfig,
  ExtensionPoint,
  TabLocation,
  ModelExtensionConstructor,
  PluginRouteRecordRaw, RegisterStore, UnregisterStore, CoreStoreSpecifics, CoreStoreConfig, OnNavToPackage, OnNavAwayFromPackage, OnLogOut,
  ExtensionEnvironment
} from './types';
import coreStore, { coreStoreModule, coreStoreState } from '@shell/plugins/dashboard-store';
import { defineAsyncComponent, markRaw, Component } from 'vue';
import { getVersionData, CURRENT_RANCHER_VERSION } from '@shell/config/version';

// Registration IDs used for different extension points in the extensions catalog
export const EXT_IDS = {
  MODELS:          'models',
  MODEL_EXTENSION: 'model-extension',
};

export type ProductFunction = (plugin: IPlugin, store: any) => void;

export class Plugin implements IPlugin {
  public id: string;
  public name: string;
  public types: any = {};
  public l10n: { [key: string]: Function[] } = {};
  public modelExtensions: { [key: string]: Function[] } = {};
  public locales: { locale: string, label: string}[] = [];
  public products: ProductFunction[] = [];
  public productNames: string[] = [];
  public routes: { parent?: string, route: RouteRecordRaw }[] = [];
  public stores: { storeName: string, register: RegisterStore, unregister: UnregisterStore }[] = [];
  public onEnter: OnNavToPackage = () => Promise.resolve();
  public onLeave: OnNavAwayFromPackage = () => Promise.resolve();
  public _onLogOut: OnLogOut = () => Promise.resolve();

  public uiConfig: { [key: string]: any } = {};

  // Plugin metadata (plugin package.json)
  public _metadata: any = {};

  public _validators: {[key:string]: Function } = {}

  // Is this a built-in plugin (bundled with the application)
  public builtin = false;

  // Uninstall hooks
  public uninstallHooks: Function[] = [];

  constructor(id: string) {
    this.id = id;
    this.name = id;

    // Initialize uiConfig for all of the possible enum values
    Object.values(ExtensionPoint).forEach((v) => {
      this.uiConfig[v] = {};
    });
  }

  get environment(): ExtensionEnvironment {
    const versionData = getVersionData();

    return {
      version:     versionData.Version,
      commit:      versionData.GitCommit,
      isPrime:     versionData.RancherPrime === 'true',
      docsVersion: `v${ CURRENT_RANCHER_VERSION }`
    };
  }

  get metadata() {
    return this._metadata;
  }

  set metadata(value) {
    this._metadata = value;
    this.name = this._metadata.name || this.id;
  }

  get version() {
    return this._metadata.version;
  }

  get validators() {
    return this._validators;
  }

  set validators(vals: {[key:string]: Function }) {
    this._validators = vals;
  }

  // Track which products the plugin creates
  DSL(store: any, productName: string) {
    const storeDSL = STORE_DSL(store, productName);

    this.productNames.push(productName);

    return storeDSL;
  }

  addProduct(product: ProductFunction): void {
    this.products.push(product);
  }

  addLocale(locale: string, label: string): void {
    this.locales.push({ locale, label });
  }

  addL10n(locale: string, fn: Function) {
    this.register('l10n', locale, fn);
  }

  addRoutes(routes: PluginRouteRecordRaw[] | RouteRecordRaw[]) {
    routes.forEach((r: PluginRouteRecordRaw | RouteRecordRaw) => {
      if (Object.keys(r).includes('parent')) {
        const pConfig = r as PluginRouteRecordRaw;

        if (pConfig.parent) {
          this.addRoute(pConfig.parent, pConfig.route);
        } else {
          this.addRoute(pConfig.route);
        }
      } else {
        this.addRoute(r as RouteRecordRaw);
      }
    });
  }

  addRoute(parentOrRoute: RouteRecordRaw | string, optionalRoute?: RouteRecordRaw): void {
    // Always add the pkg name to the route metadata
    const hasParent = typeof (parentOrRoute) === 'string';
    const parent: string | undefined = hasParent ? parentOrRoute as string : undefined;
    const route: RouteRecordRaw = hasParent ? optionalRoute as RouteRecordRaw : parentOrRoute as RouteRecordRaw;

    let parentOverride;

    if (!parent) {
      // TODO: Inspecting the route object in the browser clearly indicates it's not a RouteRecordRaw. The type needs to be changed or at least extended.
      const typelessRoute: any = route;

      if (typelessRoute.component?.layout) {
        console.warn(`Layouts have been deprecated. We still have parent routes which use the same name and styling as the previous layouts. \n\nFound a component ${ typelessRoute.component.name } with the '${ typelessRoute.component.layout }' layout specified `); // eslint-disable-line no-console
        parentOverride = typelessRoute.component.layout.toLowerCase();
      } else {
        console.warn(`Layouts have been deprecated. We still have parent routes which use the same name and styling as the previous layouts. You should specify a parent, we're currently setting the parent to 'default'`); // eslint-disable-line no-console
        parentOverride = 'default';
      }
    }

    route.meta = {
      ...route?.meta,
      pkg: this.name,
    };

    this.routes.push({ parent: parentOverride || parent, route });
  }

  private _addUIConfig(type: string, where: string, when: LocationConfig | string, config: any) {
    // For convenience 'when' can be a string to indicate a resource, so convert it to the LocationConfig format
    const locationConfig = (typeof when === 'string') ? { resource: when } : when;

    this.uiConfig[type][where] = this.uiConfig[type][where] || [];
    this.uiConfig[type][where].push({ ...config, locationConfig });
  }

  /**
   * Adds an action/button to the UI
   */
  addAction(where: string, when: LocationConfig | string, action: Action): void {
    this._addUIConfig(ExtensionPoint.ACTION, where, when, action);
  }

  /**
   * Adds a tab to the UI
   */
  addTab(where: string, when: LocationConfig | string, tab: Tab): void {
    // tackling https://github.com/rancher/dashboard/issues/11122, we don't want the tab to added in _EDIT view, unless overriden
    // on extensions side we won't document the mode param for this extension point
    if (where === TabLocation.RESOURCE_DETAIL && (typeof when === 'object' && !when.mode)) {
      when.mode = [_DETAIL];
    }

    this._addUIConfig(ExtensionPoint.TAB, where, when, this._createAsyncComponent(tab));
  }

  /**
   * Adds a panel/component to the UI
   */
  addPanel(where: string, when: LocationConfig | string, panel: Panel): void {
    this._addUIConfig(ExtensionPoint.PANEL, where, when, this._createAsyncComponent(panel));
  }

  /**
   * Adds a card to the to the UI
   */
  addCard( where: string, when: LocationConfig | string, card: Card): void {
    this._addUIConfig(ExtensionPoint.CARD, where, when, this._createAsyncComponent(card));
  }

  /**
   * Adds a model extension
   * @experimental May change or be removed in the future
   *
   * @param type Model type
   * @param clz  Class for the model extension (constructor)
   */
  addModelExtension(type: string, clz: ModelExtensionConstructor): void {
    this.register(EXT_IDS.MODEL_EXTENSION, type, clz);
  }

  /**
   * Wraps a component from an extensionConfig with defineAsyncComponent and
   * markRaw. This prepares the component to be loaded dynamically and prevents
   * Vue from making the component reactive.
   *
   * @param extensionConfig The extension configuration containing a component
   * to render.
   * @returns A new object with the same properties as the extension
   * configuration, but with the component property wrapped in
   * defineAsyncComponent and markRaw. If the extension configuration doesn't
   * have a component property, it returns the extension configuration
   * unchanged.
   */
  private _createAsyncComponent(extensionConfig: Card | Panel | Tab) {
    const { component } = extensionConfig;

    if (!component) {
      return extensionConfig;
    }

    return {
      ...extensionConfig,
      component: markRaw(defineAsyncComponent(component as () => Promise<Component>)),
    };
  }

  /**
   * Adds a new column to a table on the UI
   */
  addTableColumn(where: string, when: LocationConfig | string, column: TableColumn): void {
    this._addUIConfig(ExtensionPoint.TABLE_COL, where, when, column);
  }

  setHomePage(component: any) {
    this.addRoute({
      name: 'home',
      path: '/home',
      component
    });
  }

  addUninstallHook(hook: Function) {
    this.uninstallHooks.push(hook);
  }

  addStore(storeName: string, register: RegisterStore, unregister: UnregisterStore) {
    this.stores.push({
      storeName, register, unregister
    });
  }

  addDashboardStore(storeName: string, storeSpecifics: CoreStoreSpecifics, config: CoreStoreConfig, init?: CoreStoreInit) {
    this.stores.push({
      storeName,
      register: () => {
        return coreStore(
          this.storeFactory(storeSpecifics, config),
          config,
          init,
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
    this._onLogOut = onLogOut;
  }

  public async onLogOut(store: any) {
    await Promise.all(this.stores.map((s: any) => store.dispatch(`${ s.storeName }/onLogout`)));

    await this._onLogOut(store);
  }

  public register(type: string, name: string, fn: Function) {
    const allowPaths = ['models', 'image'];
    const nparts = name.split('/');

    // Support components in a sub-folder - component_name/index.vue (and ignore other componnets in that folder)
    // Allow store-scoped models via sub-folder - pkgname/models/storename/type will be registered as storename/type to avoid overwriting shell/models/type
    if (nparts.length === 2 && !allowPaths.includes(type)) {
      if (nparts[1] !== 'index') {
        return;
      }
      name = nparts[0];
    }

    // Accumulate l10n resources rather than replace
    if (type === 'l10n') {
      if (!this.l10n[name]) {
        this.l10n[name] = [];
      }

      this.l10n[name].push(fn);

    // Accumulate model extensions
    } else if (type === EXT_IDS.MODEL_EXTENSION) {
      if (!this.modelExtensions[name]) {
        this.modelExtensions[name] = [];
      }
      this.modelExtensions[name].push(fn);
    } else {
      if (!this.types[type]) {
        this.types[type] = {};
      }

      this.types[type][name] = fn;
    }
  }
}
