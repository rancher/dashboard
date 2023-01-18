import { RouteConfig } from 'vue-router';
import { DSL as STORE_DSL } from '@shell/store/type-map';
import {
  CoreStoreInit,
  IAction,
  IPlugin,
  LocationConfig,
  BuiltinExtensionEnhancementTypes,
  BuiltinExtensionEnhancementLocations,
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

  public uiConfig: { [key: string]: any } = {
    [BuiltinExtensionEnhancementTypes.ADD_ACTION]:    {},
    [BuiltinExtensionEnhancementTypes.ADD_CARD]:      {},
    [BuiltinExtensionEnhancementTypes.ADD_PANEL]:     {},
    [BuiltinExtensionEnhancementTypes.ADD_TAB]:       {},
    [BuiltinExtensionEnhancementTypes.ADD_TABLE_COL]: {},
  };

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

  /**
   * Adds an action/button to the UI
   */
  addAction(where: BuiltinExtensionEnhancementLocations, when: LocationConfig, action: IAction): void {
    let type: string;

    switch (where) {
    case BuiltinExtensionEnhancementLocations.UI_CONFIG_TABLE_ACTION:
      type = BuiltinExtensionEnhancementLocations.UI_CONFIG_TABLE_ACTION;

      // sets the enabled flag to true if ommited on the config
      if (!Object.keys(action).includes('enabled')) {
        action.enabled = true;
      }

      // if user defines a bulkAction, there's no need to set the bulkable flag
      if (Object.keys(action).includes('bulkAction')) {
        action.bulkable = true;
      }
      break;
    case BuiltinExtensionEnhancementLocations.UI_CONFIG_HEADER_ACTION:
      type = BuiltinExtensionEnhancementLocations.UI_CONFIG_HEADER_ACTION;
      break;
    default:
      console.error(`Unknown addAction type for extension - ${ where }`); // eslint-disable-line no-console

      return;
    }

    this.uiConfig[BuiltinExtensionEnhancementTypes.ADD_ACTION][type] = this.uiConfig[BuiltinExtensionEnhancementTypes.ADD_ACTION][type] || [];
    this.uiConfig[BuiltinExtensionEnhancementTypes.ADD_ACTION][type].push({ ...action, locationConfig: when });
  }

  /**
   * Adds a tab to the UI
   */
  addTab(where: BuiltinExtensionEnhancementLocations, when: LocationConfig, action: IAction): void {
    let type: string;

    switch (where) {
    case BuiltinExtensionEnhancementLocations.UI_CONFIG_TAB:
      type = BuiltinExtensionEnhancementLocations.UI_CONFIG_TAB;
      break;
    default:
      console.error(`Unknown addTab type for extension - ${ where }`); // eslint-disable-line no-console

      return;
    }
    this.uiConfig[BuiltinExtensionEnhancementTypes.ADD_TAB][type] = this.uiConfig[BuiltinExtensionEnhancementTypes.ADD_TAB][type] || [];
    this.uiConfig[BuiltinExtensionEnhancementTypes.ADD_TAB][type].push({ ...action, locationConfig: when });
  }

  /**
   * Adds a panel/component to the UI
   */
  addPanel(where: BuiltinExtensionEnhancementLocations, when: LocationConfig, action: IAction): void {
    let type: string;

    switch (where) {
    case BuiltinExtensionEnhancementLocations.UI_CONFIG_DETAILS_MASTHEAD:
      type = BuiltinExtensionEnhancementLocations.UI_CONFIG_DETAILS_MASTHEAD;
      break;
    case BuiltinExtensionEnhancementLocations.UI_CONFIG_DETAIL_TOP:
      type = BuiltinExtensionEnhancementLocations.UI_CONFIG_DETAIL_TOP;
      break;
    case BuiltinExtensionEnhancementLocations.UI_CONFIG_RESOURCE_LIST:
      type = BuiltinExtensionEnhancementLocations.UI_CONFIG_RESOURCE_LIST;
      break;
    default:
      console.error(`Unknown addPanel type for extension - ${ where }`); // eslint-disable-line no-console

      return;
    }

    this.uiConfig[BuiltinExtensionEnhancementTypes.ADD_PANEL][type] = this.uiConfig[BuiltinExtensionEnhancementTypes.ADD_PANEL][type] || [];
    this.uiConfig[BuiltinExtensionEnhancementTypes.ADD_PANEL][type].push({ ...action, locationConfig: when });
  }

  /**
   * Adds a card to the to the UI
   */
  addCard( where: BuiltinExtensionEnhancementLocations, when: LocationConfig, action: IAction): void {
    let type: string;

    switch (where) {
    case BuiltinExtensionEnhancementLocations.UI_CONFIG_CLUSTER_DASHBOARD_CARD:
      type = BuiltinExtensionEnhancementLocations.UI_CONFIG_CLUSTER_DASHBOARD_CARD;
      break;
    default:
      console.error(`Unknown addCard type for extension - ${ where }`); // eslint-disable-line no-console

      return;
    }

    this.uiConfig[BuiltinExtensionEnhancementTypes.ADD_CARD][type] = this.uiConfig[BuiltinExtensionEnhancementTypes.ADD_CARD][type] || [];
    this.uiConfig[BuiltinExtensionEnhancementTypes.ADD_CARD][type].push({ ...action, locationConfig: when });
  }

  /**
   * Adds a new column to a table on the UI
   */
  addTableColumn(where: BuiltinExtensionEnhancementLocations, when: LocationConfig, action: IAction): void {
    let type: string;

    switch (where) {
    case BuiltinExtensionEnhancementLocations.UI_CONFIG_RESOURCE_LIST:
      type = BuiltinExtensionEnhancementLocations.UI_CONFIG_RESOURCE_LIST;
      break;
    default:
      console.error(`Unknown addTableColumn type for extension - ${ where }`); // eslint-disable-line no-console

      return;
    }

    this.uiConfig[BuiltinExtensionEnhancementTypes.ADD_TABLE_COL][type] = this.uiConfig[BuiltinExtensionEnhancementTypes.ADD_TABLE_COL][type] || [];
    this.uiConfig[BuiltinExtensionEnhancementTypes.ADD_TABLE_COL][type].push({ ...action, locationConfig: when });
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
