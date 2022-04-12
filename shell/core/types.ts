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
export type RegisterStore = () => (store: any) => void
export type UnregisterStore = (store: any) => void

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
   * Add a module contains localisations for a specific locale
   * TODO: RC Q Neil - this should eb I10n (adding a specific set of translations)
   */
  addI18n(locale: string, fn: Function): void;

  /**
   * Add a route to the Vue Router
   */
  addRoute(route: RouteConfig): void;
  addRoute(parent: string, route: RouteConfig): void;

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
   * Add a Vuex `Core`. This will be automatically populated with required getters/mutations/actions to support Dashboard components
   *
   * The core store should container override getters/mutations/actions (in storeSpecifics) that executes plugin specific code, for instead
   * to exercise the `requests` action to make plugin specific https requests
   */
  addCoreStore(storeName: string, storeSpecifics: CoreStoreSpecifics, config: CoreStoreConfig): void;

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
