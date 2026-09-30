import { RouteRecordRaw } from 'vue-router';
import type { ExtensionManager } from '@shell/types/extension-manager';
import { PaginationSettingsStores } from '@shell/types/resources/settings';
import { IExtensionProducts } from '@shell/core/plugin-products-external';
import { RouteRecordRawWithParams } from '@shell/core/plugin-types';
import { TypeMapProduct } from '@shell/types/store/type-map';

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

export type PluginRouteRecordRaw = { [key: string]: any }

export type VuexStoreObject = { [key: string]: any }
export type CoreStoreSpecifics = { state: () => VuexStoreObject, getters: VuexStoreObject, mutations: VuexStoreObject, actions: VuexStoreObject }
export type CoreStoreConfig = { namespace: string, baseUrl?: string, modelBaseClass?: string, supportsStream?: boolean, isClusterStore?: boolean }
export type CoreStoreInit = (store: any, ctx: any) => void;
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
export type OnLogIn = (store: any) => Promise<void>;

/**
 * Navigation hooks specified as an object
 */
export type NavHooks = {
  onEnter?: OnNavToPackage,
  onLeave?: OnNavAwayFromPackage,
  onLogout?: OnLogOut,
  onLogin?: OnLogIn,
}

/** Enum regarding the extensible areas/places of the UI */
export enum ExtensionPoint {
  ACTION = 'Action', // eslint-disable-line no-unused-vars
  TAB = 'Tab', // eslint-disable-line no-unused-vars
  PANEL = 'Panel', // eslint-disable-line no-unused-vars
  CARD = 'Card', // eslint-disable-line no-unused-vars
  TABLE_COL = 'TableColumn', // eslint-disable-line no-unused-vars
  TABLE = 'Table', // eslint-disable-line no-unused-vars
  EDITABLE_RELATED_RESOURCES = 'EditableRelatedResources', // eslint-disable-line no-unused-vars
}

/** Enum regarding action locations that are extensible in the UI */
export enum ActionLocation {
  HEADER = 'header-action', // eslint-disable-line no-unused-vars
  TABLE = 'table-action', // eslint-disable-line no-unused-vars
}

/** Enum regarding panel locations that are extensible in the UI */
export enum PanelLocation {
  ABOUT_TOP = 'about-top', // eslint-disable-line no-unused-vars
  DETAILS_MASTHEAD = 'details-masthead', // eslint-disable-line no-unused-vars
  DETAIL_TOP = 'detail-top', // eslint-disable-line no-unused-vars
  RESOURCE_LIST = 'resource-list', // eslint-disable-line no-unused-vars
}

/** Enum regarding tab locations that are extensible in the UI */
export enum TabLocation {
  RESOURCE_DETAIL = 'tab', // eslint-disable-line no-unused-vars
  OTHER = 'other-tab-locations', // eslint-disable-line no-unused-vars
  RESOURCE_DETAIL_PAGE = 'resource-detail-page', // eslint-disable-line no-unused-vars
  RESOURCE_CREATE_PAGE = 'resource-create-page', // eslint-disable-line no-unused-vars
  RESOURCE_EDIT_PAGE = 'resource-edit-page', // eslint-disable-line no-unused-vars
  RESOURCE_SHOW_CONFIGURATION = 'resource-show-configuration', // eslint-disable-line no-unused-vars
  CLUSTER_CREATE_RKE2 = 'cluster-create-rke2', // eslint-disable-line no-unused-vars
}

/** Enum regarding card locations that are extensible in the UI */
export enum CardLocation {
  CLUSTER_DASHBOARD_CARD = 'cluster-dashboard-card', // eslint-disable-line no-unused-vars
}

/** Enum regarding table col locations that are extensible in the UI */
export enum TableColumnLocation {
  RESOURCE = 'resource-list', // eslint-disable-line no-unused-vars
}

/** Enum regarding table locations that are extensible in the UI */
export enum TableLocation {
  RESOURCE = 'resource-list', // eslint-disable-line no-unused-vars
}

/** Enum regarding editable related resource locations that are extensible in the UI */
export enum EditableRelatedResourcesLocation {
  RESOURCE_YAML = 'resource-yaml', // eslint-disable-line no-unused-vars
}

/** Definition of a Table extension hook */
export type TableAction = {
  tableHook: Function
};

/**
 * A resource that can be edited alongside a primary resource
 *
 * TODO: `resource` and `primaryResource` are typed as `any` until there's a shared type for a
 * classified Steve model
 */
export type EditableResource = any;

/**
 * The state of the editor showing the editable related resources
 *
 * This is reactive and owned by the editor, so anything read from it inside a
 * `EditableRelatedResourceCompute` function is re-evaluated when it changes
 */
export type EditableRelatedResourcesEditorState = {
  /**
   * The YAML currently in the editor for each resource, keyed by that resource's `nodeId`
   *
   * A `nodeId` is the resource's type and `id` together, not its `id` alone: an `id` is only
   * `namespace/name`, which two resources of different types can share
   */
  yaml: { [nodeId: string]: string },

  /** The `nodeId` of the resource currently shown in the editor */
  selected: string | null,
};

/**
 * Everything a `EditableRelatedResourceCompute` function or `EditableRelatedResourceSaveHook` is
 * given
 */
export type EditableRelatedResourceContext = {
  /** The related resource the value is being computed for */
  resource: EditableResource,

  /**
   * Every editable related resource of the primary resource, including `resource` itself. When
   * given to a save hook these are in the order they will be saved
   */
  relatedResources: EditableRelatedResource[],

  /** The resource that all of the related resources relate to */
  primaryResource: EditableResource,

  /** The reactive state of the editor */
  editorState: EditableRelatedResourcesEditorState,

  /**
   * The `nodeId` of the entry of `resource`, its key in `editorState.yaml`
   *
   * A resource that replaced another on save keeps the `nodeId` of the one it replaced, so this is
   * not always the key of `resource`. A new resource has no entry, so this is an id no entry has,
   * with the new resource's YAML in `initialYaml`
   */
  nodeId: string,

  /**
   * `resource` does not exist yet
   *
   * It was created in the editor as another resource of the same type as the entry, and is saved by
   * that entry's save hooks and `save`
   */
  isNew?: boolean,

  /** The `nodeId` of `primaryResource`, its key in `editorState.yaml` */
  primaryNodeId: string,

  /**
   * The YAML of each resource as loaded, keyed by `nodeId`
   *
   * `editorState.yaml` has no entry for a resource that was never shown in the editor, so this is
   * its YAML in that case
   */
  initialYaml: { [nodeId: string]: string },
};

/**
 * A function providing a value derived from the resources and the state of the editor
 *
 * The editor wraps these in its own `computed`, so the returned value is re-evaluated whenever
 * anything the function read changes. That means the function must read its inputs from the
 * context it is given (`ctx.editorState.yaml[id]`), rather than from values captured when the
 * related resource was created, otherwise there's nothing reactive to track
 *
 * These are resolved during render, so unlike the save hooks they must be synchronous
 */
export type EditableRelatedResourceCompute<T = any> = (ctx: EditableRelatedResourceContext) => T;

/**
 * A hook that runs either side of saving one editable related resource
 *
 * It is given the same context as a `EditableRelatedResourceCompute` function, where `resource` is
 * the related resource being saved
 *
 * Throwing (or rejecting) aborts the save and surfaces the error to the user
 */
export type EditableRelatedResourceSaveHook = (ctx: EditableRelatedResourceContext) => void | Promise<void>;

/**
 * Saves one editable related resource, in place of the resource model's own `save`
 *
 * It is given the same context as a `EditableRelatedResourceCompute` function, where `resource` is
 * the related resource to save. The save hooks still run either side of it
 *
 * Resolves to the saved resource. When that is a different resource than `resource`, for example a
 * replacement for an immutable resource, the editor shows it in place of `resource` from then on
 *
 * Throwing (or rejecting) aborts the save and surfaces the error to the user
 */
export type EditableRelatedResourceSave = (ctx: EditableRelatedResourceContext) => any | Promise<any>;

/**
 * Produces the YAML of a new resource copied from one editable related resource
 *
 * It is given the same context as a `EditableRelatedResourceCompute` function, where `resource` is
 * the related resource being copied
 *
 * Resolves to the YAML the new resource starts from. Throwing (or rejecting) shows the error in
 * place of the YAML
 */
export type EditableRelatedResourceClone = (ctx: EditableRelatedResourceContext) => string | Promise<string>;

/**
 * A banner to show for an editable related resource, for example to explain why it is shown
 * alongside the primary resource
 *
 * Matches the props of the `Banner` component. `label` is shown as is, use `labelKey` for a
 * translation
 */
export type EditableRelatedResourceBanner = {
  color?: string,
  label?: string,
  labelKey?: string,
  icon?: string,
};

/**
 * One editable related resource, plus the configuration that describes how it should be handled
 *
 * This is the entry type of the lists returned by a model's `fetchEditableRelatedResources` and by
 * the `EditableRelatedResources` extension point.
 */
export type EditableRelatedResource = {
  /** The related resource itself */
  resource: EditableResource,

  /**
   * i18n key resolving to the group heading this resource is shown under in the resource graph
   *
   * Resources sharing the same key, below the same resource, are grouped together under a single
   * heading, in the order they first appear. Resources without a key are shown first, under no
   * heading. A resource contributed by another related resource is grouped below that resource
   * rather than alongside it, so the same key can be used at every level of the tree
   */
  groupKey?: string,

  /**
   * The group heading this resource is shown under, already in the user's language
   *
   * Takes precedence over `groupKey`. For a heading that is itself resolved from the resource,
   * such as a type name from `typeDisplay`, which there is no i18n key for
   */
  group?: string,

  /**
   * `resource` uses the resource it was gathered for, rather than being used by it
   *
   * For example an Ingress gathered for the Service it routes to, a workload gathered for a
   * PersistentVolumeClaim it mounts, or a resource gathered for its owner. See
   * `EditableRelatedResourcesFetchOptions` for how this shapes the tree
   */
  dependent?: boolean,

  /**
   * `resource` is shown for reference only, and can not be edited or saved in the editor
   *
   * A read-only resource is shown after the other resources in its part of the resource graph, and
   * is not offered as a type or a source when creating a related resource. The resources found
   * below it are read-only too
   */
  readOnly?: boolean,

  /** Run before `resource` is saved, for example to apply changes made to the primary resource */
  beforeSaveHook?: EditableRelatedResourceSaveHook,

  /**
   * Saves `resource`
   *
   * When this is defined it is called instead of the resource model's own `save`, for example
   * where the resource has to be saved via the primary resource or another API. The save hooks run
   * either side of it as usual
   *
   * A new resource of the same type created in the editor is saved by this too, with `ctx.isNew` set.
   * The editor then shows the new resource with a copy of this entry, so this saves it from then on.
   * State kept for a resource between saves must be looked up from `ctx.resource`, not held per entry
   */
  save?: EditableRelatedResourceSave,

  /** Run after `resource` has been saved, for example to update references to it */
  afterSaveHook?: EditableRelatedResourceSaveHook,

  /**
   * Produces the YAML of a new resource copied from `resource`
   *
   * When this is defined it is called instead of the default, which copies the saved resource and
   * removes what a new resource must not have, such as its name and status, the same way as cloning
   * a resource from its detail page. For example where the copy must also change a reference, or
   * start from the unsaved YAML in `editorState.yaml`
   */
  clone?: EditableRelatedResourceClone,

  /**
   * A banner to show above this resource in the editor, or a falsy value to show none
   *
   * This is re-evaluated as the state of the editor changes, so it can react to what the user is
   * doing, for example warning that an edit to this resource will be overwritten by the primary
   * resource
   */
  banner?: EditableRelatedResourceCompute<EditableRelatedResourceBanner | null | undefined>,

  /**
   * Identifies this entry within the flattened tree
   *
   * The resource's type and id together where it has an id, otherwise a generated one, so that
   * every entry can be pointed at by a `parentId`. The type is part of it because an id alone is
   * only `namespace/name`, which two resources of different types can share. Populated by the
   * consuming component as it flattens the tree, so a model or extension doesn't set this -
   * anything it does set is replaced
   */
  nodeId?: string,

  /**
   * How far below the primary resource this resource was found
   *
   * `1` for the resources gathered for the primary resource itself, one more for each level below
   * that. Populated by the consuming component as it flattens the tree, so a model or extension
   * doesn't set this - anything it does set is replaced
   */
  depth?: number,

  /**
   * The `nodeId` of the related resource that contributed this one
   *
   * Absent for resources at the top of the tree, which were contributed for the primary resource
   * rather than by another related resource. Resources below another related resource are shown
   * nested below it in the resource graph. Populated by the consuming component as it flattens the
   * tree, so a model or extension doesn't set this - anything it does set is replaced
   */
  parentId?: string,
};

/**
 * Which related resources to gather for one resource in the tree
 *
 * The primary resource is asked for both. A dependency is asked only for its own dependencies, so
 * the tree follows chains of dependencies down from the primary resource. A dependent is not asked
 * for anything, so only the primary resource's own dependents are shown, one level up
 *
 * Without this the tree would also take in the other dependents of every dependency, for example
 * each workload using the same ConfigMap, then everything those use, until it held most of the
 * namespace. Entries of the kind not asked for are dropped, so gathering them only costs requests
 */
export type EditableRelatedResourcesFetchOptions = {
  /** Gather the resources this one uses, for example the ConfigMaps a workload mounts */
  dependencies: boolean,

  /**
   * Gather the resources that use this one, entries with `dependent` set, for example the Ingresses
   * routing to a Service. Only the primary resource is asked for these
   */
  dependents: boolean,
};

/**
 * Definition of an editable related resources extension
 *
 * `fetchExtensionEditableRelatedResources` is given the resource being shown and the list of related resources
 * gathered so far (from the resource's `fetchEditableRelatedResources` and any previously applied
 * extensions). It should return the new list, so entries can be added, removed or re-ordered.
 *
 * It is also given which related resources are wanted, see `EditableRelatedResourcesFetchOptions`
 *
 * It is resolved when the consuming component initialises (and not in a computed property), so it
 * may be async, for example to fetch the related resources it wants to add.
 */
export type EditableRelatedResources = {
  fetchExtensionEditableRelatedResources: (
    resource: EditableResource,
    relatedResources: EditableRelatedResource[],
    options?: EditableRelatedResourcesFetchOptions
  ) => EditableRelatedResource[] | Promise<EditableRelatedResource[]>
};

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
  ariaExpanded?: boolean | (() => boolean);
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

/**
 * Configuration required to show a header in a ResourceTable
 */
export interface HeaderOptions {
  /**
   * Order/position of the table column added by an extension
   */
  weight?: number;

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
  sort?: string | string[] | boolean;

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
   * Provide a function which accepts a row and returns the value that should be displayed in the column
   * @param row This can be any value which represents the row
   * @returns Can return {@link string | number | null | undefined} to display in the column
   */
  getValue?: (row: any) => string | number | null | undefined;
}

/**
 * Configuration required to show a header in a ResourceTable when server-side pagination is enable
 */
export type PaginationHeaderOptions = Omit<HeaderOptions, 'getValue'>

/**
 * External extension configuration for @HeaderOptions
 */
export type TableColumn = HeaderOptions;

/**
 * External extension configuration for @PaginationHeaderOptions
 */
export type PaginationTableColumn = PaginationHeaderOptions;

/**
 * External extension configuration for @PaginationSettingsStores
 */
export type ServerSidePaginationExtensionConfig = PaginationSettingsStores;

export interface ConfigureTypeOptions {
  /**
   * Override for the create button string on a list view
   */
  listCreateButtonLabelKey?: boolean;
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
   * Custom options vary pre resource type
   */
  custom?: any;

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
   * Resource types that this nav item owns but does not link to directly. For
   * example, the create page of a resource that has no nav entry of its own.
   */
  navResources?: string[];

  /**
   * The route that this type should correspond to {@link PluginRouteRecordRaw} {@link RouteRecordRaw} {@link RouteRecordRawWithParams}
   */
  route: PluginRouteRecordRaw | RouteRecordRaw | RouteRecordRawWithParams | Object;

  weight?: number;
}

export interface DSLReturnType {
  /**
   * Register multiple types by name and place them all in a group if desired. Primarily used for grouping things in the cluster explorer navigation.
   * @param types A list of types that are going to be registered
   * @param group Conditionally a group you want to places all the types in
   * @returns {@link void}
   */
  basicType: (types: string[] | string, group?: string) => void;

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
  headers: (type: string, headers?: HeaderOptions[], paginationHeaders?: PaginationHeaderOptions[]) => void;

  /**
   * Create and register a new product
   * @param options {@link ProductOptions}
   * @returns {@link void}
   */
  product: (options: TypeMapProduct) => void;

  /**
   /**
   * Remap group display names in the side-menu navigation.
   *
   * Each entry matches a group's internal ID (via string or regex) and replaces its display label
   * with a new name. This only changes how the group is labelled in the UI — it does not move
   * resources between groups.
   *
   * @param match String, string for a regex or a regex object to match against group names
   * @param replace Replacement string or function for the display name
   * @param weight Priority for applying this mapping (higher numbers applied first, default 5)
   * @param continueOnMatch If true, continue matching other rules after this one matches
   * @returns {@link void}
   */
  mapGroup: (match: string | RegExp, replace: string | Function, weight?: number, continueOnMatch?: boolean) => void;

  /**
   * Remap a type ID to a display name
   * @param match String, string for a regex or a regex object to match against type IDs
   * @param replace Replacement string or function for the display name
   * @param weight Priority for applying this mapping (higher numbers applied first, default 5)
   * @param continueOnMatch If true, continue matching other rules after this one matches
   * @returns {@link void}
   */
  mapType: (match: string | RegExp, replace: string | Function, weight?: number, continueOnMatch?: boolean) => void;

  /**
   * Create and configure a myriad of options for a type
   * @param options {@link ConfigureVirtualTypeOptions}
   * @returns {@link void}
   */
  virtualType: (options: ConfigureVirtualTypeOptions) => void;

  /**
   * Side menu ordering for grouping of pages
   * @param input Name of the group
   * @param weight Ordering to be applied for the specified group
   * @param forBasic Apply to basic type instead of regular type tree
   * @returns {@link void}
   */
  weightGroup: (input: string, weight: number, forBasic: boolean) => void;

  /**
   * Side menu ordering for simple pages
   * @param input Name of the page/resource
   * @param weight Ordering to be applied for the specified page/resource
   * @param forBasic Apply to basic type instead of regular type tree
   * @returns {@link void}
   */
  weightType: (input: string, weight: number, forBasic: boolean) => void;

  /**
   * Never show the specified type in the navigation
   * @param regexOrString String, string for a regex or a regex object to match against type names
   * @returns {@link void}
   */
  ignoreType: (regexOrString: string | RegExp) => void;

  /**
   * Never show the specified group or any types in it
   * @param regexOrString String, string for a regex or a regex object to match against group names
   * @param fn Conditional function that accepts getters and returns true if the group should be ignored
   * @returns {@link void}
   */
  ignoreGroup: (regexOrString: string | RegExp, fn?: (getters: any) => boolean) => void;

  /**
   * Move a resource type into a different navigation group
   * @param match String or regex to match against resource type names
   * @param group Target group name to move the matched types into
   * @param weight Ordering weight for the mapping (default: 5)
   * @returns {@link void}
   */
  moveType: (match: string | RegExp, group: string, weight?: number) => void;

  /**
   * Control visibility of bulk actions (e.g. delete) in the list view toolbar for a specific resource type
   * @param type The resource type to configure
   * @param hide Whether to hide bulk actions. Set to `true` to hide them
   * @returns {@link void}
   */
  hideBulkActions: (type: string, hide: boolean) => void;

  labelGroup: (group: string, label: string | undefined, labelKey?: string) => void;

  setGroupDefaultType: (group: string, defaultType: string) => void;
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
   * [DEPRECATED] Definition of the extension
   */
  $plugin: ExtensionManager,
  /**
   * Definition of the extension
   */
  $extension: ExtensionManager,
  /**
   * Function to retrieve a localised string
   */
  t: (key: string) => string,
};

/**
 * Constructor signature for a model extension
 */
export type ModelExtensionConstructor = new (context: ModelExtensionContext) => Object;

/**
 * Interface for a UI Extension
 */
export interface IExtension extends IExtensionProducts {

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
  addRoute(route: RouteRecordRawWithParams | RouteRecordRaw): void;
  addRoute(parent: string, route: RouteRecordRawWithParams | RouteRecordRaw): void;

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
   * Adds a new column to a ResourceTable
   *
   * @param where
   * @param when
   * @param action
   * @param column
   *  The information required to show a header and values for a column in a table
   * @param paginationColumn
   *  As per `column`, but is used where server-side pagination is enabled
   */
  addTableColumn(where: TableColumnLocation | string, when: LocationConfig | string, column: TableColumn, paginationColumn?: TableColumn): void;

  /**
   * Adds to Table events hook on ResourceTable
   *
   * @param where
   * @param when
   * @param action
   */
  addTableHook(where: TableLocation | string, when: LocationConfig | string, action: TableAction): void;

  /**
   * Adds to the list of related resources that can be edited alongside a resource (for example in
   * the multi-resource YAML editor)
   *
   * `when` is matched against the current route for the primary resource. For each related
   * resource it is matched against the current route with `resource`, `namespace` and `id` set to
   * that resource, so an extension registered for a type contributes wherever a resource of that
   * type appears in the tree
   *
   * @param where
   * @param when
   * @param action
   */
  addEditableRelatedResources(where: EditableRelatedResourcesLocation | string, when: LocationConfig | string, action: EditableRelatedResources): void;

  /**
   * Set the component to use for the landing home page
   * @param component Home page component
   */
  setHomePage(component: any): void;

  /**
   * Add routes to the Vue Router
   */
  addRoutes(routes: PluginRouteRecordRaw[] | RouteRecordRawWithParams[] | RouteRecordRaw[]): void;

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
    onLogOut?: OnLogOut,
    onLogIn?: OnLogIn,
  ): void;
  addNavHooks(hooks: NavHooks): void;

  enableServerSidePagination(config: ServerSidePaginationExtensionConfig): void;

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
   *
   * A special type `'l10n-global'` can be used to register a value that will be
   * substituted for `[[name]]` tokens in translation strings, allowing shared
   * terms (e.g. product names) to be defined once and referenced across
   * localisations. The value can be a string or a function returning a string.
   * If no global is registered for a given name, the token's name is used as
   * the value.
   *
   * @param {String} type type of thing to register, e.g. 'edit'
   * @param {String} name unique name of 'something'
   * @param {Function|string|boolean} fn function that dynamically loads the module for the thing being registered, or (for `l10n-global`) the value itself
   */
  register(type: string, name: string, fn: Function | boolean | string): void;

  /**
   * Will return all of the configuration functions used for creating a new product.
   * @deprecated Should use `addProduct` and `extendProduct` instead and avoid using this directly
   * @param store The store that was passed to the function that's passed to `plugin.addProduct(function)`
   * @param productName The name of the new product. This name is displayed in the navigation.
   */
  DSL(store: any, productName: string): DSLReturnType;

  /**
   * Get information about the Extension Environment
   */
  get environment(): ExtensionEnvironment;
}

/**
 * Legacy interface for a plugin, which is just an extension but with the `DSL` function.
 * @deprecated Should use `IExtension` interface instead
 */
export type IPlugin = IExtension;

// Internal interface
// Built-in extensions may use this, but external extensions should not, as this is subject to change
// Defined as any for now
export type IInternal = any;
