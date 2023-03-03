import { RouteConfig } from 'vue-router';
import { DSL as STORE_DSL } from '@shell/store/type-map';
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
} from './types';
import coreStore, { coreStoreModule, coreStoreState } from '@shell/plugins/dashboard-store';
import {
  PluginRouteConfig, RegisterStore, UnregisterStore, CoreStoreSpecifics, CoreStoreConfig, OnNavToPackage, OnNavAwayFromPackage, OnLogOut
} from '@shell/core/types';

export class Plugin implements IPlugin {
  public id: string;
  public name: string;
  public types: any = {};
  public l10n: { [key: string]: Function[] } = {};
  public locales: { locale: string, label: string}[] = [];
  public products: Function[] = [];
  public productNames: string[] = [];
  public routes: { parent?: string, route: RouteConfig }[] = [];
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

  addProduct(product: Function): void {
    this.products.push(product);
  }

  addLocale(locale: string, label: string): void {
    this.locales.push({ locale, label });
  }

  addL10n(locale: string, fn: Function) {
    this.register('l10n', locale, fn);
  }

  addRoutes(routes: PluginRouteConfig[] | RouteConfig[]) {
    routes.forEach((r: PluginRouteConfig | RouteConfig) => {
      if (Object.keys(r).includes('parent')) {
        const pConfig = r as PluginRouteConfig;

        if (pConfig.parent) {
          this.addRoute(pConfig.parent, pConfig.route);
        } else {
          this.addRoute(pConfig.route);
        }
      } else {
        this.addRoute(r as RouteConfig);
      }
    });
  }

  addRoute(parentOrRoute: RouteConfig | string, optionalRoute?: RouteConfig): void {
    // Always add the pkg name to the route metadata
    const hasParent = typeof (parentOrRoute) === 'string';
    const parent: string | undefined = hasParent ? parentOrRoute as string : undefined;
    const route: RouteConfig = hasParent ? optionalRoute as RouteConfig : parentOrRoute as RouteConfig;

    route.meta = {
      ...route?.meta,
      pkg: this.name,
    };

    this.routes.push({ parent, route });
  }

  private _addUIConfig(type: string, where: string, when: LocationConfig | string, config: any) {
    // For convenience 'when' can be a string to indicate a resource, so convert it to the LocationConfig format
    const locationConfig = (typeof when === 'string') ? { resource: when } : when;

    this.uiConfig[type][where] = this.uiConfig[type][where] || [];
    this.uiConfig[type][where].push({ ...config, locationConfig });
  }

  registerExtensionProduct(store: any, options: object) {
    console.log('registerProd this', this);
    console.log('registerProd options', options);
    console.log('registerProd store', store);
    console.log('registerProd name', this.name);
    console.log('registerProd productNames', this.productNames);

    const { product } = STORE_DSL(store, this.productNames[0]);

    console.log('registerProd this V2', this);

    product(options);
  }

  registerType(store: any, entries: [any]) {
    const {
      configureType,
      virtualType,
      weightType,
      weightGroup,
      headers,
      basicType
    } = STORE_DSL(store, this.productNames[0]);

    // STILL MISSING: virtualType, spoofedType...

    console.log('registerType', store, entries);

    const singleMenuEntry: { [key: string]: any } = {};
    const menuGrouping: { [key: string]: any } = {};

    // apply menu registration (types, headers, weights)
    for (let i = 0; i < entries.length; i++) {
      // no ID, no funny...
      if (!entries[i].id) {
        // eslint-disable-next-line no-console
        console.error('you are missing the resource identifier (id)');
        continue;
      }

      // register types
      // resource as page
      if (!entries[i].type || entries[i].type === 'resource') {
        configureType(entries[i].id, entries[i].options || {});
      // custom page
      } else if (entries[i].type === 'custom-page') {
        virtualType(entries[i].id, entries[i].options || {});
      }

      // register headers
      if (entries[i].listCols && Array.isArray(entries[i].listCols)) {
        headers(entries[i].id, entries[i].listCols);
      }

      // prepare data for basicType (registering menu entries)
      if (entries[i].menuGroupingId) {
        if (!menuGrouping[entries[i].menuGroupingId]) {
          menuGrouping[entries[i].menuGroupingId] = { menuItems: [entries[i].id] };
        } else {
          menuGrouping[entries[i].menuGroupingId].menuItems.push(entries[i].id);
        }

        if (entries[i].menuGroupingWeight && parseInt(entries[i].menuGroupingWeight) >= 0) {
          menuGrouping[entries[i].menuGroupingId].weight = entries[i].menuGroupingWeight;
        }
      } else {
        singleMenuEntry[entries[i].id] = {};

        if (entries[i].weight && parseInt(entries[i].weight) >= 0) {
          singleMenuEntry[entries[i].id].weight = entries[i].weight;
        }
      }
    }

    // register menu entries for non-grouped resources
    Object.keys(singleMenuEntry).forEach((key) => {
      basicType([key]);

      if (singleMenuEntry[key].weight) {
        weightType(key, singleMenuEntry[key].weight, true);
      }
    });

    // register menu entries for grouped resources
    Object.keys(menuGrouping).forEach((key) => {
      basicType(menuGrouping[key].menuItems, key);

      if (menuGrouping[key].weight) {
        weightGroup(key, menuGrouping[key].weight, true);
      }
    });

    console.log('registerType this', this);
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
    this._addUIConfig(ExtensionPoint.TAB, where, when, tab);
  }

  /**
   * Adds a panel/component to the UI
   */
  addPanel(where: string, when: LocationConfig | string, panel: Panel): void {
    this._addUIConfig(ExtensionPoint.PANEL, where, when, panel);
  }

  /**
   * Adds a card to the to the UI
   */
  addCard( where: string, when: LocationConfig | string, card: Card): void {
    this._addUIConfig(ExtensionPoint.CARD, where, when, card);
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
    const nparts = name.split('/');

    // Support components in a sub-folder - component_name/index.vue (and ignore other componnets in that folder)
    // Allow store-scoped models via sub-folder - pkgname/models/storename/type will be registered as storename/type to avoid overwriting shell/models/type
    if (nparts.length === 2 && type !== 'models') {
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
    } else {
      if (!this.types[type]) {
        this.types[type] = {};
      }
      this.types[type][name] = fn;
    }
  }
}
