import { ProductFunction } from '@shell/core/plugin';
import { HeaderOptions, PaginationHeaderOptions, PluginRouteRecordRaw } from '@shell/core/types';
import { NAME as EXPLORER_PROD_NAME } from '@shell/config/product/explorer.js';
import { NAME as CLUSTER_MAN_PROD_NAME } from '@shell/config/product/manager.js';
import { NAME as SETTINGS_PROD_NAME } from '@shell/config/product/settings.js';
import { NAME as AUTH_PROD_NAME } from '@shell/config/product/auth.js';
import { RouteRecordRawWithParams } from '@shell/core/plugin-types';
import { RouteComponent } from 'vue-router';

type LabelOrKey = ( // TODO: RC
  /** Human-readable label for the product
   * Either label or labelKey are required */
  | { label: string; labelKey?: string }
  /** Translation key for the label of the product
   * Either label or labelKey are required */
  | { labelKey: string; label?: string }
)

type Async<T> = () => Promise<T>;

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

// ----

export interface ProductChildMetadata {
  /** Product name/unique identifier for the product */
  name: string;
  /** Ordering weight for the among its siblings, if applicable */
  weight?: number;
   /** Human-readable label for the product
   * Either label or labelKey are required */
  label?: string,
   /** Human-readable label for the product
   * Either label or labelKey are required */
  labelKey?: string,

}

/**
 * Represents allowed configuration for a child page
 */
type _ProductChildMetadata = {
  /** Product name/unique identifier for the product */
  name: string;
  /** Ordering weight for the among its siblings, if applicable */
  weight?: number;
} & LabelOrKey;

/**
 * Represents a Vue component or an async function that resolves to a Vue component, used for route components in product configuration
 */
export type VueRouteComponent = RouteComponent | Async<RouteComponent>;

export type ProductChildVirtualPage = {
  /** Component to render for this custom page */
  component: VueRouteComponent;

  show?: {
    /** Display only if condition is met (relates to IF_HAVE in shell/store/type-map) */
    ifHave?: boolean;
    /** Display only if feature is present (relates to shell/store/features) */
    ifFeature?: string;
    /** Display only if resource type exists */
    ifHaveType?: string;
    /** Used in conjunction with "ifHaveType", display only if resource type allows this verb (GET, POST, PUT, DELETE) */
    ifHaveVerb?: string;
  };

  navigation?: {
    /** Entry route definition for this custom page */
    customRoute?: RouteRecordRawWithParams | PluginRouteRecordRaw | Object;
      /** Whether this custom page is exact match */
   exact?: boolean;
     /** Whether this custom page has an exact path match */
  'exact-path'?: boolean;
  }

  resource?: {
    /** Whether this custom page is namespaced or not */
    namespaced?: boolean;
  }

  display?: {
    /** Whether this custom page will act as an overview page */
    overview?: boolean;
  }
  // TODO: RC ProductMetadata2222 search

  // display?: {
  //   /** Override for the name displayed */
  //   displayName?: string;
  //   /** If false, hide state in columns and masthead */
  //   showState?: boolean;
  //   /** If false, hide age in columns and masthead */
  //   showAge?: boolean;
  //   /** If false, hide masthead config button in view mode */
  //   showConfigView?: boolean;
  //   /** If false, hide masthead in list view */
  //   showListMasthead?: boolean;
  //     /** Show the Masthead in the edit resource component */
  //   resourceEditMasthead?: boolean;
  //     /** Hide this type from the nav/search bar on downstream clusters (will only show in "local" cluster) */
  //   localOnly?: boolean;
  // }

  // actions?: {
  //   /** If false, disable create even if schema says it's allowed */
  //   isCreatable?: boolean;
  //   /** If false, disable for edit */
  //   isEditable?: boolean;
  //   /** If false, disable for remove/delete */
  //   isRemovable?: boolean;
  //   /** If false, cannot edit or show yaml */
  //   canYaml?: boolean;
  // }

  // lists?: {
  //   /** Override for the create button string on a list view */
  //   listCreateButtonLabelKey?: string;
  // }

  // navigation?: {
  //   /** Entry route definition for this resource page */
  //   customRoute?: RouteRecordRawWithParams;
  // }
}

/**
 * Represents a custom page with a component
 */
export type ProductChildCustomPage = _ProductChildMetadata & ProductChildVirtualPage;

/**
 * Represents a resource page with a type (K8s resource)
 */
export type ProductChildResourcePage = {
  /** K8s resource type name for a resource page */
  type: string;

  resourceMenu?: {
    /** Ordering weight for this page among its siblings */
    weight?: number;
  }

  display?: {
    /** Override for the name displayed */
    displayName?: string;
    /** If false, hide state in columns and masthead */
    showState?: boolean;
    /** If false, hide age in columns and masthead */
    showAge?: boolean;
    /** If false, hide masthead config button in view mode */
    showConfigView?: boolean;
    /** If false, hide masthead in list view */
    showListMasthead?: boolean;
    /** Show the Masthead in the edit resource component */
    resourceEditMasthead?: boolean;
    /** Hide this type from the nav/search bar on downstream clusters (will only show in "local" cluster) */
    localOnly?: boolean;
  }

  actions?: {
    /** If false, disable create even if schema says it's allowed */
    isCreatable?: boolean;
    /** If false, disable for edit */
    isEditable?: boolean;
    /** If false, disable for remove/delete */
    isRemovable?: boolean;
    /** If false, cannot edit or show yaml */
    canYaml?: boolean;
  }

  lists?: {
    /** Table headers for this resource type (server-side pagination) */
    headers?: HeaderOptions[];
    /** Whether to hide bulk actions for this resource */
    hideBulkActions?: boolean;
    /** Override for the create button string on a list view */
    listCreateButtonLabelKey?: string;
    /** Use this to override the resource name used in the list view for this type */
    overrideListResourceName?: string;
  }

  navigation?: {
    /** Entry route definition for this resource page */
    customRoute?: RouteRecordRawWithParams;
  }

};

export type ProductChildResourcePageInternal = {
  lists: {
    /** Use this to override the resource name used in the list view for this type */
    overrideListResourceName?: string;
    /** Table headers for this resource type (server-side pagination) */
    headers?: HeaderOptions[];
    /** Table headers for this resource type (client-side pagination) */
    localHeaders?: PaginationHeaderOptions[];
  }

  resourceMenu: {
    /** Whether to hide this resource from the side-menu entirely */
    hideFromNav?: boolean;
  }
}

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
export type ProductChildGroup = _ProductChildMetadata & {
  component?: VueRouteComponent;
  children: ProductChild[];
  /** Default child to navigate to */
  default?: string;
};

// ----

/**
 * Represents the allowed configuration for a product
 */
type ProductMetadata = {
    /**
   * Product name (unique identifier)
   */
  name: string;

  /**
   * Control conditions on when to show the product
   */
  show?: {
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
     * Hide the product if the type is present (opposite of ifHaveType)
     */
    ifNotHaveType?: string | RegExp;
  }

  /**
   * Control page links
   */
  navigation?: {
    /**
     * The route that the product will lead to if click on in navigation.
     */
    to?: PluginRouteRecordRaw;
  }

  /**
   * Control how resources are fetched, filtered and stored
   */
  resources?: {
    /**
     * Hide the system resources in lists
     */
    hideSystemResources?: boolean;

    /**
    * The vuex store that this product should use by default i.e. 'management'
    */
    vuexStore?: string; // TODO: RC inStore
  }

  /**
   * Indicates whether UI Extensions can add pages to this product
   */
  extendable?: boolean;
} & LabelOrKey

export type ProductMetadataInternal = ProductMetadata & {
  /**
   * The category this product belongs under. i.e. 'config'
   */
  category?: string; // TODO: RC

  /**
   * Hide the Namespace location
   */
  hideNamespaceLocation?: boolean;

    // Do not use - internal use only
  version?: number;

    /**
   * @internal
   * Use `renameGroups` on the product metadata to remap group display names in the side-menu. Each entry matches a group's internal ID (via string or regex) and replaces its display label with a new name. This only changes how the group is labelled in the UI — it does not move resources between groups.
   *
   * The `groupSelector` is evaluated against group internal IDs. It can be an exact string or a `RegExp` pattern. The `newName` value is the new display name.
   *
   * const product: ProductMetadata = {
   *   name:  'my-app',
   *   label: 'My App',
   *   renameGroups: [
   *     // Rename a group with an ugly internal ID to a friendlier display name
   *     { groupSelector: 'cert-manager.io', newName: 'Certificates' },
   *     // Use a regex to rename all groups matching a pattern
   *     { groupSelector: /^networking\./, newName: 'Networking' },
   *   ],
   * };
   */
  renameGroups?: {
    /** String or regex to match against group internal IDs */
    groupSelector: RegExp | string;
    /** Display name to use for matching groups */
    newName: string;
  }[];

  /**
   * @internal
   *
   * Use `moveToGroup` on the product metadata to move pages (resource types or custom pages) into specific side-menu groups. This is useful when a page should appear inside a group but isn't defined as a child of that group in the config.
   * Each entry identifies a page by its `entryId` — the resource `type` string or the custom page `name` — and moves it into the specified group. Use the group's `name` as you defined it in your config.
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
   *    { entryId: 'pod', groupName: 'monitoring' },
   *    // Move a custom page into the 'monitoring' group
   *    { entryId: 'dashboard', groupName: 'monitoring' },
   *   ],
   * };
   *
   * extension.addProduct(product, [monitoringGroup, { type: 'pod' }, dashboardPage]);
   *
   * Note: The `entryId` must match a page declared in the same product config — either a resource page's `type` or a custom page's `name`. The target `groupName` must be a `ProductChildGroup` defined in the same config. If either is not found, an error is thrown at registration time listing the available options. Only exact string identifiers are supported (no regex).
   *
   * The optional `weight` parameter controls precedence when multiple `moveToGroup` rules target the same page (default: `5`). Higher weight takes precedence.
  */
  moveToGroup?: {
    /** Page identifier — the resource `type` string or the custom page `name` */
    entryId: string;
    /** Target group name as defined in your group config (`name` property) */
    groupName: string;
    /** Ordering weight for the mapping (default: 5). Higher weight takes precedence when multiple rules match */
    weight?: number;
  }[];

  /**
   * @internal
   *
   * maps to DSL ignoreGroup
   *
   * Use `ignoreGroups` on the product metadata to hide specific side-menu groups. Each entry specifies a `groupSelector` to match group names — either an exact string or a regex pattern.
   *
   * The `condition` callback is optional. When provided, it receives the store getters and returns `true` to hide the group (conditional hide). When omitted, the group is always hidden (unconditional hide).
   *
   * Example usage:
   * const product: ProductMetadata = {
   *   name:  'my-app',
   *   label: 'My App',
   *   ignoreGroups: [
   *     // Always hide the "internal" group (unconditional — no condition)
   *     { groupSelector: 'internal' },
   *     // Hide all groups matching a regex pattern (unconditional)
   *     { groupSelector: /^deprecated/ },
   *     // Conditionally hide based on a feature flag
   *     {
   *       groupSelector: 'experimental',
   *       condition:     (getters) => !getters['features/isEnabled']('experimental-feature'),
   *     },
   *   ],
   * };
   *
   *
   * In this example, the "internal" group is always hidden, any group with a name starting with "deprecated-" is hidden, and the "experimental" group is hidden unless the "experimental-feature" flag is enabled in the store.
   */
  ignoreGroups?: {
    /** String or regex to match against group names */
    groupSelector: string | RegExp;
    /** Optional conditional function that accepts the root Dashboard Vuex store getters and returns true if the group should be ignored */
    condition?: (getters: any) => boolean;
  }[]

    /**
   * Leaving these here for completeness but I don't think these should be advertised as useable to plugin creators.
   */
  // ifHaveVerb: string | RegExp;
  // removable: string;
  // showWorkspaceSwitcher: boolean;
  // supportRoute: string;
  // typeStoreMap: string;
}

export type ProductMetadataAdd = ProductMetadata & {
  /**
   * Control what appears in the page's header
   */
  pageHeader?: {
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
    * Show the cluster info
    *
    * // TODO: RC rename showClusterSwitcher
    */
    showClusterInfo?: boolean;

      /**
     * Show the namespace filter in the header
     */
    showNamespaceFilter?: boolean;

    /**
     * TODO: RC
     */
    iconHeader?: string;
  }

  /**
   * Control what appears in the page's side bar
   */
  pageSideBar?: {
    /**
     * A number used to determine where in navigation this item will be placed. The highest number will be at the top of the list.
     */
    weight?: number;

    icon: {
      /**
      * The icon that should be displayed beside this item in the navigation.
      */
      icon?: string; // TODO: RC

      /**
       * Alternative to the icon property. Uses require
       */
      svg?: Function;
    }
  }
}

export type ProductMetadataAddInternal = ProductMetadataAdd & ProductMetadataInternal;

// export interface ProductOptionsExtend extends ProductOptions {
//   // TODO: RC Q not possible, it would be the extends + the weight of the group
//   /**
//    * Control what appears in the page's resource menu
//    */
//   resourceMenu?: {
//         /**
//      * A number used to determine where in navigation this item will be placed. The highest number will be at the top of the list.
//      */
//     weight?: number;
//   }
// }

// --------------------
export type ProductMetadataSinglePageComponent = {
  /** Component to render for this product (single page product) */
  component: VueRouteComponent;
}

/**
 * Represents a single page product, which is a product that only has one page and
 * therefore does not need to be represented in the navigation as a group with children.
 */
export type ProductMetadataSinglePage = ProductMetadata & ProductMetadataSinglePageComponent;

// ----

export interface IExtensionProducts {
/**
   * Register a top-level product as a flag on the plugin
   * @internal - DO NOT USE - Internal API only
   */
  _registerTopLevelProduct(): void;

  /**
   * Add a product to the sidebar, with children and a side menu for navigation for internal pages
   * @param name
   * @param pages
   */
  addProduct(product: ProductMetadataAdd, pages: ProductChildPage[]): void;
  addProduct(product: ProductMetadataAdd, pages: ProductChildGroup[]): void;
  addProduct(product: ProductMetadataAdd, pages: ProductChild[]): void;

  /**
   * Add a product to the sidebar, without children (no side menu, single page only)
   * @param product
   */
  addProduct(product: ProductMetadataSinglePage): void;

  /**
   * Add a product with just a name (convenience/bridge method for quick setup).
   * Creates a basic product with an empty page component automatically.
   * This is useful for getting started quickly - expand to the full API once you're ready to add custom pages.
   * @param productName Simple product name - will be used as both the name and label
   */
  addProduct(productName: string): void;

  /**
   * Add a product to the sidebar (deprecated, use other signatures of addProduct instead)
   * @deprecated Use other `addProduct` signatures instead
   * @param importFn Function that will import the module containing a product definition
   */
  addProduct(importFn: ProductFunction): void;

  /**
   * Extend an existing product in Rancher, with children and a side menu for navigation for internal pages
   *
   * @param product Product to be extended
   * @param config Product extension configuration
   */
  extendProduct(product: StandardProductName | string, config: ProductChildPage[]): void;
  extendProduct(product: StandardProductName | string, config: ProductChildGroup[]): void;
  extendProduct(product: StandardProductName | string, config: ProductChild[]): void;
}
