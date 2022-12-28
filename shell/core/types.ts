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

export const UI_CONFIG_HEADER_ACTION = 'header-action';
export const UI_CONFIG_TAB = 'tab';
export const UI_CONFIG_TABLE_ACTION = 'table-action';
export const UI_CONFIG_DETAILS_MASTHEAD = 'details-masthead';
export const UI_CONFIG_DETAIL_TOP = 'detail-top';
export const UI_CONFIG_RESOURCE_LIST = 'resource-list';
export const UI_CONFIG_GLOBAL_SETTING = 'global-setting';
export const UI_CONFIG_CLUSTER_DASHBOARD_CARD = 'cluster-dashboard-card';
export const UI_CONFIG_TABLE_COL = 'table-col';

export type IAction = any;

/**
 * Interface for a Dashboard plugin
 */
export interface IPlugin {
  /**
   * Add a product
   * @param importFn Function that will import the module containing a product definition
   */
  addProduct(importFn: Function): void;

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
   * Add a module contains localisations for a specific locale
   */
  addL10n(locale: string, fn: Function): void;

  /**
   * Add a route to the Vue Router
   */
  addRoute(route: RouteConfig): void;
  addRoute(parent: string, route: RouteConfig): void;

  /**
   * Adds a UI action for an extension to a particular area of the UI
   */
  addUIAction(type: string, locationConfig: object, action: IAction): void;

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
