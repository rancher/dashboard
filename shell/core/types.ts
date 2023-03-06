import { RouteConfig } from 'vue-router';

// package.json metadata
export interface PackageMetadata {
  name: string;
  version: string;
  description: string;
  icon: string;
}

// export interface Route {
//   name: string;
//   path: string;
//   component: Object | Function,
//   children: Route[];
// }

export type VuexStoreObject = { [key: string]: any }
export type CoreStoreSpecifics = { state: () => VuexStoreObject, getters: VuexStoreObject, mutations: VuexStoreObject, actions: VuexStoreObject }
export type CoreStoreConfig = { namespace: string, baseUrl?: string, modelBaseClass?: string, supportsStream?: boolean, isClusterStore?: boolean }
export type CoreStoreInit = (store: any, ctx: any) => void;
export type RegisterStore = () => (store: any) => void
export type UnregisterStore = (store: any) => void

export type PluginRouteConfig = {parent?: string, route: RouteConfig}

export type OnEnterLeavePackageConfig = {
  clusterId: string,
  product: string,
  oldProduct: string,
  isExt: string,
  oldIsExt: string
}

export type OnNavToPackage = (store: any, config: OnEnterLeavePackageConfig) => Promise<void>;
export type OnNavAwayFromPackage = (store: any, config: OnEnterLeavePackageConfig) => Promise<void>;
export type OnLogOut = (store: any) => Promise<void>;

/** Enum regarding the extensionable areas/places of the UI */
export enum ExtensionPoint {
  ACTION = 'Action', // eslint-disable-line no-unused-vars
  TAB = 'Tab', // eslint-disable-line no-unused-vars
  PANEL = 'Panel', // eslint-disable-line no-unused-vars
  CARD = 'Card', // eslint-disable-line no-unused-vars
  TABLE_COL = 'TableColumn', // eslint-disable-line no-unused-vars
}

/** Enum regarding action locations that are extensionable in the UI */
export enum ActionLocation {
  HEADER = 'header-action', // eslint-disable-line no-unused-vars
  TABLE = 'table-action', // eslint-disable-line no-unused-vars
}

/** Enum regarding panel locations that are extensionable in the UI */
export enum PanelLocation {
  DETAILS_MASTHEAD = 'details-masthead', // eslint-disable-line no-unused-vars
  DETAIL_TOP = 'detail-top', // eslint-disable-line no-unused-vars
  RESOURCE_LIST = 'resource-list', // eslint-disable-line no-unused-vars
}

/** Enum regarding tab locations that are extensionable in the UI */
export enum TabLocation {
  RESOURCE_DETAIL = 'tab', // eslint-disable-line no-unused-vars
}

/** Enum regarding card locations that are extensionable in the UI */
export enum CardLocation {
  CLUSTER_DASHBOARD_CARD = 'cluster-dashboard-card', // eslint-disable-line no-unused-vars
}

/** Enum regarding table col locations that are extensionable in the UI */
export enum TableColumnLocation {
  RESOURCE = 'resource-list', // eslint-disable-line no-unused-vars
}

/** Definition of the shortcut object (keyboard shortcuts) */
export type ShortCutKey = {
  windows?: string[];
  mac?: string[];
};

/** Definition of the action options (table actions) */
export type ActionOpts = {
  event: any;
  isAlt: boolean;
  action: any;
};

/** Definition of an extension action (options that can be passed when setting an extension action) */
export type Action = {
  label?: string;
  labelKey?: string;
  tooltipKey?: string;
  tooltip?: string;
  shortcut?: string | ShortCutKey;
  svg?: Function;
  icon?: string;
  multiple?: boolean;
  enabled?: (ctx: any) => boolean;
  invoke: (opts: ActionOpts, resources: any[]) => void | boolean | Promise<boolean>;
};

/** Definition of a panel (options that can be passed when defining an extension panel enhancement) */
export type Panel = {
  component: Function;
};

/** Definition of a card (options that can be passed when defining an extension card enhancement) */
export type Card = {
  label?: string;
  labelKey?: string;
  component: Function;
};

export type TableColumn = any;

/** Definition of a tab (options that can be passed when defining an extension tab enhancement) */
export type Tab = {
  name: string;
  label?: string;
  labelKey?: string;
  tooltipKey?: string;
  tooltip?: string;
  showHeader?: boolean;
  weight?: number;
  component: Function;
};

/** Definition of the locationConfig object (used in extensions) */
export type LocationConfig = {
  product?: string[],
  resource?: string[],
  namespace?: string[],
  cluster?: string[],
  id?: string[],
  mode?: string[]
};

/**
 * Interface for a Dashboard plugin
 */
export interface IPlugin {
  registerExtensionAsProduct(store: any, option: object): void;

  /**
   * Add a product
   * @param importFn Function that will import the module containing a product definition
   * @param productName Product name
   */
  addProduct(importFn: Function, productName: string): void;

  /**
   * Add a locale to the i18n store
   * @param locale Locale id (e.g. en-us)
   * @param label Label for the locale to be displayed in the i18n chooser
   */
  addLocale(locale: string, label: string): void;

  /**
   * Plugin metadata
   */
  metadata: PackageMetadata;

  /**
   * Validators used in the same manner as shell/utils/custom-validators
   */
  validators: {[key: string]: Function};

  /**
   * Add a module containing localisations for a specific locale
   */
  addL10n(locale: string, fn: Function): void;

  /**
   * Add a route to the Vue Router
   */
  addRoute(route: RouteConfig): void;
  addRoute(parent: string, route: RouteConfig): void;

  /**
   * Adds an action/button to the UI
   */
  addAction(where: ActionLocation | string, when: LocationConfig | string, action: Action): void;

  /**
   * Adds a tab to the UI (ResourceTabs component)
   */
  addTab(where: TabLocation | string, when: LocationConfig | string, action: Tab): void;

  /**
   * Adds a panel/component to the UI
   */
  addPanel(where: PanelLocation | string, when: LocationConfig | string, action: Panel): void;

  /**
   * Adds a card to the UI
   */
  addCard(where: CardLocation | string, when: LocationConfig | string, action: Card): void;

  /**
   * Adds a new column to the SortableTable component
   */
  addTableColumn(where: TableColumnLocation | string, when: LocationConfig | string, action: TableColumn): void;

  /**
   * Set the component to use for the landing home page
   * @param component Home page component
   */
  setHomePage(component: any): void;

  /**
   * Add routes to the Vue Router
   */
  addRoutes(routes: PluginRouteConfig[] | RouteConfig[]): void;

   /**
    * Add a hook to be called when the plugin is uninstalled
    * @param hook Function to call when the plugin is uninstalled
    */
  addUninstallHook(hook: Function): void;

  /**
   * Add a generic Vuex Store
   */
  addStore(storeName: string, register: RegisterStore, unregister: UnregisterStore): void;
  /**
   * Add a dashboard Vuex store.
   *
   * This will contain the toolset (getters/mutations/actions/etc) required by the dashboard to support Dashboard components. Most of these
   * will be automatically supplemented when the store is registered, others though will need to be provided to supply package specific
   * functionality (see storeSpecifics). For instance a component may request to fetch all of a resource type which, via a number of generic
   * actions, will eventually call a `request` action which will make the raw http request. This is a pkg specific feature so needs the
   * `request` action needs to be supplied in the `storeSpecifics`
   */
  addDashboardStore(storeName: string, storeSpecifics: CoreStoreSpecifics, config: CoreStoreConfig, init?: CoreStoreInit): void;

  /**
   * Add hooks that will execute when a user navigates
   * - to a route owned by this package
   * - from a route owned by this package
   */
  addNavHooks(
    onEnter?: OnNavToPackage,
    onLeave?: OnNavAwayFromPackage,
    onLogOut?: OnLogOut
  ): void;

  /**
   * Register 'something' that can be dynamically loaded - e.g. model, edit, create, list, i18n
   * @param {String} type type of thing to register, e.g. 'edit'
   * @param {String} name unique name of 'something'
   * @param {Function} fn function that dynamically loads the module for the thing being registered
   */
  register(type: string, name: string, fn: Function): void;
}
