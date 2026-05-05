import type { RouteComponent, RouteRecordRaw } from 'vue-router';
import type { PluginRouteRecordRaw } from './types';
import { NAME as EXPLORER_PROD_NAME } from '@shell/config/product/explorer.js';
import { NAME as CLUSTER_MAN_PROD_NAME } from '@shell/config/product/manager.js';
import { NAME as SETTINGS_PROD_NAME } from '@shell/config/product/settings.js';
import { NAME as AUTH_PROD_NAME } from '@shell/config/product/auth.js';
import { ProductOptions, HeaderOptions, PaginationHeaderOptions } from '@shell/core/types';

type Async<T> = () => Promise<T>;

export type RouteRecordRawWithParams = Omit<RouteRecordRaw, 'redirect' | 'children' | 'path'> & {
  /** Path for route - can include dynamic segments like ':id'. Based on vue-router routes */
  path?: string;
  /** Params for route - key-value pairs representing route parameters */
  params?: Record<string, any>;
  /** Child routes */
  children?: RouteRecordRawWithParams[];
  /** Optional redirect */
  redirect?: RouteRecordRaw['redirect'];
};

/**
 * Product registration route generation options
 */
export type ProductRegistrationRouteGenerationOptions = {
  /**
   * Whether to generate the route for an existing product - extending a product - or a new top level product
   */
  extendProduct? : boolean;
  /**
   * Component to be used for the route (used in virtualType and configureType routes)
   */
  component?: any;
  /**
   * Generated route should omit the path property
   */
  omitPath?: boolean;
}

/**
 * Represents the allowed extensible products in Rancher Dashboard
 */
export const StandardProductNames = {
  EXPLORER: EXPLORER_PROD_NAME,
  MANAGER:  CLUSTER_MAN_PROD_NAME,
  SETTINGS: SETTINGS_PROD_NAME,
  AUTH:     AUTH_PROD_NAME,
} as const;

/**
 * Type representing a standard product name value
 */
export type StandardProductName = (typeof StandardProductNames)[keyof typeof StandardProductNames];

/**
 * Represents allowed configuration for a child page
 */
export type ProductChildMetadata = {
  /** Product name/unique identifier for the product */
  name: string;
  /** Ordering weight for the among its siblings, if applicable */
  weight?: number;
} & (
  /** Human-readable label for the child page
   * Either label or labelKey are required */
  { label: string; labelKey?: string }
  /** Translation key for the label of the child page
   * Either label or labelKey are required */
  | { labelKey: string; label?: string }
);

/**
 * Represents the allowed configuration for a custom page (virtualType)
 */
export type VirtualTypeConfiguration = {
  /** Display only if condition is met (relates to IF_HAVE in shell/store/type-map) */
  ifHave?: boolean;
  /** Display only if feature is present (relates to shell/store/features) */
  ifFeature?: string;
  /** Display only if resource type exists */
  ifHaveType?: string;
  /** Used in conjunction with "ifHaveType", display only if resource type allows this verb (GET, POST, PUT, DELETE) */
  ifHaveVerb?: string;
  /** Display label for the custom page */
  label?: string;
  /** Translation key for the label */
  labelKey?: string;
  /** Name of the page (unique identifier) */
  name?: string;
  /** Entry route definition for this custom page */
  route?: RouteRecordRawWithParams | PluginRouteRecordRaw | Object;
  /** Icon for the custom page (relates to icons in https://github.com/rancher/icons) */
  icon?: 'compass';
  /** Whether this custom page is namespaced or not */
  namespaced?: boolean;
  /** Ordering weight for the custom page */
  weight?: number;
  /** Whether this custom page is exact match */
  exact?: boolean;
  /** Whether this custom page will act as an overview page */
  overview?: boolean;
  /** Whether this custom page has an exact path match */
  'exact-path'?: boolean;
}

/**
 * Represents the allowed configuration for a resource page (configureType)
 */
export type ConfigureTypeConfiguration = {
  /** Override for the name displayed */
  displayName?: string;
  /** Override for the create button string on a list view */
  listCreateButtonLabelKey?: string;
  /** If false, disable create even if schema says it's allowed */
  isCreatable?: boolean;
  /** If false, disable for edit */
  isEditable?: boolean;
  /** If false, disable for remove/delete */
  isRemovable?: boolean;
  /** If false, hide state in columns and masthead */
  showState?: boolean;
  /** If false, hide age in columns and masthead */
  showAge?: boolean;
  /** If false, hide masthead config button in view mode */
  showConfigView?: boolean;
  /** If false, hide masthead in list view */
  showListMasthead?: boolean;
  /** If false, cannot edit or show yaml */
  canYaml?: boolean;
  /** Show the Masthead in the edit resource component */
  resourceEditMasthead?: boolean;
  /** Entry route definition for this resource page */
  customRoute?: RouteRecordRawWithParams;
  /** Hide this type from the nav/search bar on downstream clusters (will only show in "local" cluster) */
  localOnly?: boolean;
  // resource: undefined; // Use this resource in ResourceDetails instead
  // resourceDetail: undefined; // Use this resource specifically for ResourceDetail's detail component
  // resourceEdit: undefined; // Use this resource specifically for ResourceDetail's edit component
  // depaginate: undefined; // Use this to depaginate requests for this type
  // notFilterNamespace: undefined; // Define namespaces that do not need to be filtered
  // used in configureType options, to be typed later if needed
  // listGroups: [
  //       {
  //         icon:       'icon-role-binding',
  //         value:      'node',
  //         field:      'roleDisplay',
  //         hideColumn: ROLE.name,
  //         tooltipKey: 'resourceTable.groupBy.role'
  //       }
  //     ]
}

/**
 * Represents a Vue component or an async function that resolves to a Vue component, used for route components in product configuration
 */
export type VueRouteComponent = RouteComponent | Async<RouteComponent>;

/**
 * Metadata for route generation to a product overview page
 */
export type OverviewPageRoutingMetadata = {
  /** Name of the overview page */
  name: string;
  /** Component to render for the overview page */
  component: VueRouteComponent;
}

/**
 * Represents a custom page with a component
 */
export type ProductChildCustomPage = ProductChildMetadata & {
  /** Component to render for this custom page */
  component: VueRouteComponent;
  /** Optional configuration for the page */
  config?: VirtualTypeConfiguration;
};

/**
 * Represents a resource page with a type (K8s resource)
 */
export type ProductChildResourcePage = {
  /** K8s resource type name for a resource page */
  type: string;
  /** Optional configuration for the resource page */
  config?: ConfigureTypeConfiguration;
  /** Ordering weight for this page among its siblings */
  weight?: number;
  /** Use this to override the resource name used in the list view for this type */
  overrideListResourceName?: string;
  /** Whether to hide this resource from the side-menu entirely */
  hideFromNav?: boolean;
  /** Whether to hide bulk actions for this resource */
  hideBulkActions?: boolean;
  /** Table headers for this resource type (client-side pagination) */
  headers?: HeaderOptions[];
  /** Table headers for this resource type (server-side pagination) */
  sspHeaders?: PaginationHeaderOptions[];
};

/**
 * Represents a page item (custom page or resource page) in a product's config
 * - For custom pages: use `component` with `name` and `label`/`labelKey`
 * - For resource pages: use `type` with optional `config` and `headers`
 */
export type ProductChildPage = ProductChildCustomPage | ProductChildResourcePage;

/**
 * Represents a product child in the navigation
 * This can be a type, a group, or a route.
 */
export type ProductChild = ProductChildGroup | ProductChildPage; // eslint-disable-line no-use-before-define

/**
 * Represents a group of child pages in a product configuration
 */
export type ProductChildGroup = ProductChildMetadata & {
  component?: VueRouteComponent;
  children: ProductChild[];
  /** Default child to navigate to */
  default?: string;
};

/**
 * Represents the allowed configuration for a product
 */
export type ProductMetadata = Omit<ProductOptions, 'name' | 'label' | 'labelKey' | 'category' | 'to' | 'version' | 'inStore'> & {
  /**
   * Product name (unique identifier)
   */
  name: string;
  /**
   * @internal
   * Use `renameGroups` on the product metadata to remap group display names in the side-menu. Each entry matches a group's internal ID (via string or regex) and replaces its display label with a new name. This only changes how the group is labelled in the UI — it does not move resources between groups.
   *
   * The `regexOrString` is evaluated against group internal IDs. It can be an exact string or a `RegExp` pattern. The `group` value is the new display name.
   *
   * const product: ProductMetadata = {
   *   name:  'my-app',
   *   label: 'My App',
   *   renameGroups: [
   *     // Rename a group with an ugly internal ID to a friendlier display name
   *     { regexOrString: 'cert-manager.io', group: 'Certificates' },
   *     // Use a regex to rename all groups matching a pattern
   *     { regexOrString: /^networking\./, group: 'Networking' },
   *   ],
   * };
   */
  renameGroups?: {
    /** String or regex to match against group internal IDs */
    regexOrString: RegExp | string;
    /** Display name to use for matching groups */
    group: string;
  }[];
  /**
   * @internal
   *
   * Use `moveToGroup` on the product metadata to move pages (resource types or custom pages) into specific side-menu groups. This is useful when a page should appear inside a group but isn't defined as a child of that group in the config.
   * Each entry identifies a page by its `id` — the resource `type` string or the custom page `name` — and moves it into the specified group. Use the group's `name` as you defined it in your config.
   *
   * const monitoringGroup: ProductChildGroup = {
   *   name:     'monitoring',
   *   label:    'Monitoring',
   *   children: [
   *    { name: 'alerts', label: 'Alerts', component: () => import('./pages/Alerts.vue') },
   *   ],
   * };

   * const dashboardPage: ProductChildCustomPage = {
   *   name: 'dashboard', label: 'Dashboard', component: () => import('./pages/Dashboard.vue'),
   * };

   * const product: ProductMetadata = {
   *   name:        'my-app',
   *   label:       'My App',
   *   moveToGroup: [
   *    // Move the 'pod' resource type into the 'monitoring' group
   *    { id: 'pod', group: 'monitoring' },
   *    // Move a custom page into the 'monitoring' group
   *    { id: 'dashboard', group: 'monitoring' },
   *   ],
   * };
   *
   * extension.addProduct(product, [monitoringGroup, { type: 'pod' }, dashboardPage]);
   *
   * Note: The `id` must match a page declared in the same product config — either a resource page's `type` or a custom page's `name`. The target `group` must be a `ProductChildGroup` defined in the same config. If either is not found, an error is thrown at registration time listing the available options. Only exact string identifiers are supported (no regex).
   *
   * The optional `weight` parameter controls precedence when multiple `moveToGroup` rules target the same page (default: `5`). Higher weight takes precedence.
  */
  moveToGroup?: {
    /** Page identifier — the resource `type` string or the custom page `name` */
    id: string;
    /** Target group name as defined in your group config (`name` property) */
    group: string;
    /** Ordering weight for the mapping (default: 5). Higher weight takes precedence when multiple rules match */
    weight?: number;
  }[];
  /**
   * @internal
   *
   * maps to DSL ignoreGroup
   *
   * Use `ignoreGroups` on the product metadata to hide specific side-menu groups. Each entry specifies a `regexOrString` to match group names — either an exact string or a regex pattern.
   *
   * The `fn` callback is optional. When provided, it receives the store getters and returns `true` to hide the group (conditional hide). When omitted, the group is always hidden (unconditional hide).
   *
   * Example usage:
   * const product: ProductMetadata = {
   *   name:  'my-app',
   *   label: 'My App',
   *   ignoreGroups: [
   *     // Always hide the "internal" group (unconditional — no fn)
   *     { regexOrString: 'internal' },
   *     // Hide all groups matching a regex pattern (unconditional)
   *     { regexOrString: /^deprecated/ },
   *     // Conditionally hide based on a feature flag
   *     {
   *       regexOrString: 'experimental',
   *       fn:            (getters) => !getters['features/isEnabled']('experimental-feature'),
   *     },
   *   ],
   * };
   *
   *
   * In this example, the "internal" group is always hidden, any group with a name starting with "deprecated-" is hidden, and the "experimental" group is hidden unless the "experimental-feature" flag is enabled in the store.
   */
  ignoreGroups?: {
    /** String or regex to match against group names */
    regexOrString: string | RegExp;
    /** Optional conditional function that accepts the root Dashboard Vuex store getters and returns true if the group should be ignored */
    fn?: (getters: any) => boolean }[];
} & (
  /** Human-readable label for the product
   * Either label or labelKey are required */
  | { label: string; labelKey?: string }
  /** Translation key for the label of the product
   * Either label or labelKey are required */
  | { labelKey: string; label?: string }
);

/**
 * Represents a single page product, which is a product that only has one page and
 * therefore does not need to be represented in the navigation as a group with children.
 */
export type ProductSinglePage = ProductMetadata & {
  /** Component to render for this product (single page product) */
  component: VueRouteComponent;
};
