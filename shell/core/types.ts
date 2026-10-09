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
  RELATED_RESOURCES = 'RelatedResources', // eslint-disable-line no-unused-vars
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

/** Enum regarding related resource locations that are extensible in the UI */
export enum RelatedResourcesLocation {
  RESOURCE_YAML = 'resource-yaml', // eslint-disable-line no-unused-vars
}

/** Definition of a Table extension hook */
export type TableAction = {
  tableHook: Function
};

/**
 * A resource model shown in the multi-resource YAML editor: the primary resource, or a related
 * resource, editable or read-only
 *
 * TODO: `resource` and `primaryResource` are typed as `any` until there's a shared type for a
 * classified Steve model
 */
export type ResourceModel = any;

/**
 * The state of the editor showing the related resources
 *
 * This is reactive and owned by the editor, so anything read from it inside a
 * `RelatedResourceCompute` function is re-evaluated when it changes
 */
export type RelatedResourcesEditorState = {
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
 * Everything a `RelatedResourceCompute` function or `RelatedResourceSaveHook` is
 * given
 */
export type RelatedResourceContext = {
  /** The related resource the value is being computed for */
  resource: ResourceModel,

  /** Every related resource of the primary resource, including `resource` itself */
  relatedResources: RelatedResource[],

  /** The resource that all of the related resources relate to */
  primaryResource: ResourceModel,

  /** The reactive state of the editor */
  editorState: RelatedResourcesEditorState,

  /**
   * The `nodeId` of the entry of `resource`, its key in `editorState.yaml`
   *
   * A resource that replaced another on save keeps the `nodeId` of the one it replaced, so this is
   * not always the key of `resource`
   */
  nodeId: string,

  /** The `nodeId` of `primaryResource`, its key in `editorState.yaml` */
  primaryNodeId: string,

  /**
   * What the YAML of each resource is compared with, keyed by `nodeId`
   *
   * The YAML as loaded. For a primary resource edited in a form before its YAML was shown, the YAML
   * from before those edits
   *
   * `editorState.yaml` has an entry for the primary resource and every resource shown in the
   * editor. For any other resource this is its YAML
   */
  initialYaml: { [nodeId: string]: string },

  /**
   * Saves the resource with this `nodeId` as the editor's save button for that resource does, its
   * save hooks included, for example to save the primary resource once a save changed its YAML
   *
   * Resolves to the saved resource, or null when its `beforeSaveHook` cancelled the save. Rejects
   * when the save fails
   */
  saveResource: (nodeId: string) => Promise<ResourceModel | null>,
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
export type RelatedResourceCompute<T = any> = (ctx: RelatedResourceContext) => T;

/**
 * A hook that runs either side of saving one related resource
 *
 * It is given the same context as a `RelatedResourceCompute` function. For a
 * `beforeSaveHook` `resource` is the related resource about to be saved. For an `afterSaveHook` it
 * is the saved resource, which can be a replacement for the one loaded
 *
 * Without a `save`, the resource is saved from its YAML in `editorState.yaml`, not from `resource`.
 * A `beforeSaveHook` changes what is saved by writing `editorState.yaml[nodeId]`
 *
 * A `beforeSaveHook` resolving to `false` cancels the save without an error, for example when the
 * user declines a confirmation. When the editor is saving every modified resource, the resources
 * not saved yet are not saved either
 *
 * Throwing (or rejecting) aborts the save and surfaces the error to the user
 */
export type RelatedResourceSaveHook = (ctx: RelatedResourceContext) => void | boolean | Promise<void | boolean>;

/**
 * Saves one related resource, in place of the resource model's own `save`
 *
 * It is given the same context as a `RelatedResourceCompute` function, where `resource` is
 * the related resource to save. The save hooks still run either side of it
 *
 * Resolves to the saved resource. When that is a different resource than `resource`, for example a
 * replacement for an immutable resource, the editor shows it in place of `resource` from then on
 *
 * Throwing (or rejecting) aborts the save and surfaces the error to the user
 */
export type RelatedResourceSave = (ctx: RelatedResourceContext) => any | Promise<any>;

/**
 * A banner to show for a related resource, for example to explain why it is shown
 * alongside the primary resource
 *
 * Matches the props of the `Banner` component. `label` is shown as is, use `labelKey` for a
 * translation
 */
export type RelatedResourceBanner = {
  color?: string,
  label?: string,
  labelKey?: string,
  icon?: string,
};

/**
 * One related resource, plus the configuration that describes how it should be handled
 *
 * This is the entry type of the lists returned by a model's `fetchRelatedResources` and by
 * the `RELATED_RESOURCES` extension point.
 */
export type RelatedResource = {
  /** The related resource itself */
  resource: ResourceModel,

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
   * `resource` is gathered only when the resource it was gathered for is the primary resource, is
   * not asked for its own related resources, and is saved after the primary resource
   *
   * Set it where `resource` uses the resource it was gathered for, for example an Ingress gathered
   * for the Service it routes to, a workload gathered for a PersistentVolumeClaim it mounts, or a
   * resource gathered for its owner. Set it too where the resource it was gathered for selects
   * `resource` by label, for example the workloads a Service selects, so the tree does not take in
   * everything each of them uses. See `RelatedResourcesFetchOptions`
   */
  dependent?: boolean,

  /**
   * `resource` is shown for reference only, and can not be edited or saved in the editor
   *
   * The editor also makes an entry read-only where the user can not edit the yaml of `resource`
   * (`canEditYaml` false), or where another resource controls it (an ownerReference with
   * `controller: true`). A read-only resource is listed in the read-only section of the resource
   * graph, wherever it was found, and is not asked for its own related resources
   */
  readOnly?: boolean,

  /** Run before `resource` is saved, for example to apply changes made to the primary resource */
  beforeSaveHook?: RelatedResourceSaveHook,

  /**
   * Saves `resource`
   *
   * When this is defined it is called instead of the resource model's own `save`, for example
   * where the resource has to be saved via the primary resource or another API. The save hooks run
   * either side of it as usual
   */
  save?: RelatedResourceSave,

  /** Run after `resource` has been saved, for example to update references to it */
  afterSaveHook?: RelatedResourceSaveHook,

  /**
   * A banner to show above this resource in the editor, or a falsy value to show none
   *
   * This is re-evaluated as the state of the editor changes, so it can react to what the user is
   * doing, for example warning that an edit to this resource will be overwritten by the primary
   * resource
   *
   * Shown above the banner the editor adds itself for a resource that a controller, rancher, fleet
   * or helm writes
   */
  banner?: RelatedResourceCompute<RelatedResourceBanner | null | undefined>,

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
 * for anything, so only the primary resource's own dependents are shown, one level up. Nor is a
 * read-only resource, see `RelatedResource.readOnly`
 *
 * Without this the tree would also take in the other dependents of every dependency, for example
 * each workload using the same ConfigMap, then everything those use, until it held most of the
 * namespace. Entries of the kind not asked for are dropped, so gathering them only costs requests
 */
export type RelatedResourcesFetchOptions = {
  /** Gather the resources this one uses, for example the ConfigMaps a workload mounts */
  dependencies: boolean,

  /**
   * Gather the entries with `dependent` set: the resources that use this one, for example the
   * Ingresses routing to a Service, and those it selects by label. Only the primary resource is
   * asked for these
   */
  dependents: boolean,
};

/**
 * Definition of a related resources extension
 *
 * `fetchExtensionRelatedResources` is given the resource being shown and the list of related resources
 * gathered so far (from the resource's `fetchRelatedResources` and any previously applied
 * extensions). It should return the new list, so entries can be added, removed or re-ordered.
 *
 * It is also given which related resources are wanted, see `RelatedResourcesFetchOptions`
 *
 * It is resolved when the consuming component initialises (and not in a computed property), so it
 * may be async, for example to fetch the related resources it wants to add.
 */
export type RelatedResourcesExtension = {
  fetchExtensionRelatedResources: (
    resource: ResourceModel,
    relatedResources: RelatedResource[],
    options?: RelatedResourcesFetchOptions
  ) => RelatedResource[] | Promise<RelatedResource[]>
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
  /** Header actions: the tooltip while the action is disabled, saying why. */
  disabledTooltipKey?: string;
  disabledTooltip?: string;
  shortcut?: string | ShortCutKey;
  svg?: Function;
  icon?: string;
  multiple?: boolean;
  /**
   * Whether the action can be used. For a header action, a function returning a boolean is asked
   * again whenever the reactive state it reads changes; one returning a promise, on navigation.
   */
  enabled?: Function | boolean;
  ariaExpanded?: boolean | (() => boolean);
  /**
   * Header actions: no button, only the `shortcut` - for an action that is a keyboard shortcut and
   * nothing else. Defaults to false: the action is a button.
   */
  hidden?: boolean;
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
   * `false` for a column that isn't data, eg a button: table views leaves it out of Columns, Group
   * By, the query and exports
   */
  tableViews?: boolean;

  /**
   * A string that will show in the table column as a header
   */
  label?: string;

  /**
   * A translation key where the resulting string will show in the table column as a header
   */
  labelKey?: string;

  /**
   * How the cell's value is resolved: either a string path into the row (i.e. `metadata.name`), or
   * a function given the row that returns the value to display. Under server-side pagination a
   * function is display-only - `sort`/`search` must still be string paths to indexed fields.
   */
  value?: string | ((row: any) => any);

  /**
   * A string which represents the path to access the value from the row object which we'll use to sort i.e. `row.meta.value`
   */
  sort?: string | string[] | boolean;

  /**
   * A string which represents the path to access the value from the row object which we'll use to search i.e. `row.meta.value`.
   * A column can name more than one path, as `sort` can. It can be false to disable searching on this field
   */
  search?: string | boolean | string[];

  /**
   * Number of pixels the column should be in the table
   */
  width?: number;

  /**
   * Number of pixels the column's cells narrow to at most, however little room the table has
   */
  minWidth?: number;

  /**
   * Number of pixels the column's cells widen to at most. Longer text wraps
   */
  maxWidth?: number;

  /**
   * Number of lines a cell shows at most. Text that needs more ends in an ellipsis, and the whole
   * text is offered as a tooltip
   */
  lineClamp?: number;

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
  addRelatedResources(where: RelatedResourcesLocation | string, when: LocationConfig | string, action: RelatedResourcesExtension): void;

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
