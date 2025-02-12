import { ProductFunction } from './plugin';
import { RouteRecordRaw } from 'vue-router';

// Cluster Provisioning types
export * from './types-provisioning';

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

export type PluginRouteRecordRaw = { [key: string]: any }

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
  CLUSTER_CREATE_RKE2 = 'cluster-create-rke2', // eslint-disable-line no-unused-vars
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
  enabled?: Function | boolean;
  invoke: (opts: ActionOpts, resources: any[], globals?: any) => void | boolean | Promise<boolean>;
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
  mode?: string[],
  hash?: string[],
  /**
   * path match from URL (excludes host address)
   */
  path?: { [key: string]: string | boolean}[],
  /**
   * Query Params from URL
   */
  queryParam?: { [key: string]: string},
  /**
   * Context specific params.
   *
   * Components can provide additional context specific params that this value must match
   */
  context?: { [key: string]: string},
};

/**
 * Environment metadata that extensions can access
 */
export type ExtensionEnvironment = {
  version: string;
  commit: string;
  isPrime: boolean;
  docsVersion: string; /** e.g. 'v2.10' */
};

export interface ProductOptions {
  /**
   * The category this product belongs under. i.e. 'config'
   */
  category?: string;

  /**
   * Hide the Copy KubeConfig button in the header
   */
  hideCopyConfig?: boolean;

  /**
   * Hide the Download KubeConfig button in the header
   */
  hideKubeConfig?: boolean;

  /**
   * Hide the Kubectl Shell button in the header
   */
  hideKubeShell?: boolean;

  /**
   * Hide the Namespace location
   */
  hideNamespaceLocation?: boolean;

  /**
   * Hide the system resources
   */

  hideSystemResources?: boolean;
  /**
   * The icon that should be displayed beside this item in the navigation.
   */
  icon?: string,

  /**
   * Only load the product if the feature is present
   */
  ifFeature?: string | RegExp;

  /**
   * Only load the product if the type is present
   */
  ifHave?: string;

  /**
   * Only load the product if the group is present
   */
  ifHaveGroup?: string | RegExp;

  /**
   * Only load the product if the type is present
   */
  ifHaveType?: string | RegExp;

  /**
   * The vuex store that this product should use by default i.e. 'management'
   */
  inStore?: string;

  /**
   * Show the cluster switcher in the navigation
   */
  showClusterSwitcher?: boolean;

  /**
   * Show the namespace filter in the header
   */
  showNamespaceFilter?: boolean;

  /**
   * A number used to determine where in navigation this item will be placed. The highest number will be at the top of the list.
   */
  weight?: number;

  /**
   * The route that the product will lead to if click on in navigation.
   */
  to?: PluginRouteRecordRaw;

  /**
   * Alternative to the icon property. Uses require
   */
  svg?: Function;

  /**
   * Product name
   */
  name?: string;

  /**
   * Leaving these here for completeness but I don't think these should be advertised as useable to plugin creators.
   */
  // ifHaveVerb: string | RegExp;
  // removable: string;
  // showWorkspaceSwitcher: boolean;
  // supportRoute: string;
  // typeStoreMap: string;
}

export interface HeaderOptions {
  /**
   * Name of the header. This should be unique.
   */
  name?: string;

  /**
   * A string that will show in the table column as a header
   */
  label?: string;

  /**
   * A translation key where the resulting string will show in the table column as a header
   */
  labelKey?: string;

  /**
   * A string which represents the path to access the value from the row object i.e. `row.meta.value`.
   */
  value?: string;

  /**
   * A string which represents the path to access the value from the row object which we'll use to sort i.e. `row.meta.value`
   */
  sort?: string | string[];

  /**
   * A string which represents the path to access the value from the row object which we'll use to search i.e. `row.meta.value`.
   * It can be false to disable searching on this field
   */
  search?: string | boolean;

  /**
   * Number of pixels the column should be in the table
   */
  width?: number;

  /**
   * The name of a custom formatter. The available formatters can bee seen in `@rancher/shell/components/formatter`
   */
  formatter?: string;

  /**
   * These options are dependent on the formatter that's chosen. Examples can be seen in `@rancher/shell/components/formatter` and `@rancher/shell/config/table-headers`
   */
  formatterOpts?: any;

  /**
   * Provide a function which accets a row and returns the value that should be displayed in the column
   * @param row This can be any value which represents the row
   * @returns Can return {@link string | number | null | undefined} to display in the column
   */
  getValue?: (row: any) => string | number | null | undefined;
}

export interface ConfigureTypeOptions {
  /**
   * The resource can edit/show yaml
   */
  canYaml?: boolean;

  /**
   * Modify the way the name looks when displayed
   */
  displayName?: string;

  /**
   * New resources can be created of this type
   */
  isCreatable?: boolean;

  /**
   * Resources of this type can be deleted/removed
   */
  isRemovable?: boolean;

  /**
   * Resources of this type can be edited
   */
  isEditable?: boolean;

  /**
   * This type should be grouped by namespaces when displayed in a table
   */
  namespaced?: boolean;

  /**
   * Show the age column in when displaying this type in a table
   */
  showAge?: boolean;

   /**
   * Show the masthead at the top of the list view of this type
   */
  showListMasthead?: boolean;

   /**
   * Show the state column in when displaying this type in a table
   */
  showState?: boolean;

  /**
   * Define where this type/page should navigate to (menu entry routing)
   */
  customRoute?: Object;

  /**
   * Leaving these here for completeness but I don't think these should be advertised as useable to plugin creators.
   */
  // alias
  // depaginate
  // graphConfig
  // hasGraph
  // limit
  // listGroups
  // localOnly
  // location
  // match
  // realResource
  // resource
  // resourceDetail
  // resourceEdit
  // showConfigView
}

export interface ConfigureVirtualTypeOptions extends ConfigureTypeOptions {
  /**
   * Only load the product if the type is present
   */
  ifHave?: string;

  /**
   * Only load the product if the type is present
   */
  ifHaveType?: string | RegExp | Object;

  /**
   * The label that this type should display
   */
  label?: string;

  /**
   * The translation key displayed anywhere this type is referenced
   */
  labelKey?: string;

  /**
   * An identifier that should be unique across all types
   */
  name: string;

  /**
   * The route that this type should correspond to {@link PluginRouteRecordRaw} {@link RouteRecordRaw}
   */
  route: PluginRouteRecordRaw | RouteRecordRaw | Object;
}

export interface DSLReturnType {
  /**
   * Register multiple types by name and place them all in a group if desired. Primarily used for grouping things in the cluster explorer navigation.
   * @param types A list of types that are going to be registered
   * @param group Conditionally a group you want to places all the types in
   * @returns {@link void}
   */
  basicType: (types: string[], group?: string) => void;

  /**
   * Configure a myriad of options for the specified type
   * @param type The type to be configured
   * @param options {@link ConfigureTypeOptions}
   * @returns {@link void}
   */
  configureType: (type: string, options: ConfigureTypeOptions) => void;

  /**
   * Register the headers/columns that should be used when rendering a table for the specified type.
   * @param type The type you'd like to register headers/columns for.
   * @param headers {@link HeaderOptions[]}
   * @returns {@link void}
   */
  headers: (type: string, headers: HeaderOptions[]) => void;

  /**
   * Create and register a new product
   * @param options {@link ProductOptions}
   * @returns {@link void}
   */
  product: (options: ProductOptions) => void;

  /**
   * Create and label a group. The group will show up in navigation
   * @param groupNane Name of the group
   * @param label Label in navigation
   * @returns {@link void}
   */
  mapGroup: (groupName: string, label: string) => void;

  /**
   * Create and configure a myriad of options for a type
   * @param options {@link ConfigureVirtualTypeOptions}
   * @returns {@link void}
   */
  virtualType: (options: ConfigureVirtualTypeOptions) => void;

  /**
   * Leaving these here for completeness but I don't think these should be advertised as useable to plugin creators.
   */
  // componentForType: (type: string, replacementType: string)
  // groupBy: (type: string, field: string)
  // hideBulkActions: (type: string, field)
  // ignoreGroup: (regexOrString)
  // ignoreType: (regexOrString)
  //
  // mapType: (match, replace)
  // moveType: (match, group)
  // setGroupDefaultType: (input, defaultType)
  // spoofedType: (obj)
  // weightGroup: (input, weight, forBasic)
  // weightType: (input, weight, forBasic)
}

/**
 * Context for the constructor of a model extension
 */
export type ModelExtensionContext = {
  /**
   * Dispatch vuex actions
   */
  dispatch: any,
  /**
   * Get from vuex store
   */
  getters: any,
  /**
   * Used to make http requests
   */
  axios: any,
  /**
   * Definition of the extension
   */
  $plugin: any,
  /**
   * Function to retrieve a localised string
   */
  t: (key: string) => string,
};

/**
 * Constructor signature for a model extension
 */
export type ModelExtensionConstructor = (context: ModelExtensionContext) => Object;

/**
 * Interface for a Dashboard plugin
 */
export interface IPlugin {
  /**
   * Add a product
   * @param importFn Function that will import the module containing a product definition
   */
  addProduct(importFn: ProductFunction): void;

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
  addRoute(route: RouteRecordRaw): void;
  addRoute(parent: string, route: RouteRecordRaw): void;

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
  addRoutes(routes: PluginRouteRecordRaw[] | RouteRecordRaw[]): void;

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
   * Adds a model extension
   * @experimental May change or be removed in the future
   *
   * @param type Model type
   * @param clz  Class for the model extension (constructor)
   */
  addModelExtension(type: string, clz: ModelExtensionConstructor): void;

  /**
   * Register 'something' that can be dynamically loaded - e.g. model, edit, create, list, i18n
   * @param {String} type type of thing to register, e.g. 'edit'
   * @param {String} name unique name of 'something'
   * @param {Function} fn function that dynamically loads the module for the thing being registered
   */
  register(type: string, name: string, fn: Function | Boolean): void;

  /**
   * Will return all of the configuration functions used for creating a new product.
   * @param store The store that was passed to the function that's passed to `plugin.addProduct(function)`
   * @param productName The name of the new product. This name is displayed in the navigation.
   */
  DSL(store: any, productName: string): DSLReturnType;

  /**
   * Get information about the Extension Environment
   */
  get environment(): ExtensionEnvironment;
}

// Internal interface
// Built-in extensions may use this, but external extensions should not, as this is subject to change
// Defined as any for now
export type IInternal = any;
