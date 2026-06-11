import {
  ProductMetadata,
  ProductChildResourcePage,
  ProductChildCustomPage,
} from '@shell/core/plugin-products-external';
import { RouteRecordRawWithParams } from '@shell/core/plugin-types';
import { PaginationHeaderOptions, PluginRouteRecordRaw } from '@shell/core/types';

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

// --------------  Page Related Resource --------------
// When updating external page types also update where they're converted to the internal page type
// i.e. `TypeMapVirtualType` or `TypeMapConfigureType` usage in shell/core/plugin-products-base.ts

/**
 * Conceptually a `TypeMapVirtualType`
 */
export type ProductChildCustomPageInternal = ProductChildCustomPage & {
  navigation?: {
    /** Whether this custom page is exact match */
    exact?: boolean;
    /** Whether this custom page has an exact path match */
    'exact-path'?: boolean;
  }
}

/**
 * Conceptually a `TypeMapConfigureType`
 */
export type ProductChildResourcePageInternal = ProductChildResourcePage & {
  /**
  * TODO: RC jsdoc
  */
  listConfig?: {
    /** Table headers for this resource type (client-side pagination) */
    localHeaders?: PaginationHeaderOptions[];
  }

  /**
  * TODO: RC jsdoc
  */
  sideMenu?: {
    /** Whether to hide this resource from the side-menu entirely */
    hideFromNav?: boolean;
    navigation?: {
      /** Entry route definition for this custom page */
      customRoute?: RouteRecordRawWithParams | PluginRouteRecordRaw | Object;
    }
  }

   /**
   * TODO: RC jsdoc
   */
  resource?: {
     /**
   * TODO: RC jsdoc
   */
    depaginate?: boolean;
  }
}

// --------------  Product Related Resource --------------

// When updating external product types also update where they're converted to the internal product type
// i.e. `TypeMapProduct` usage in shell/core/plugin-products-base.ts

// -----
export type ProductMetadataInternal = ProductMetadata & {
  /**
   * The category this product belongs under. i.e. 'config'
   */
  category?: string;

  /** Do not use - internal use only */
  version?: number;

  /**
  * TODO: RC jsdoc
  */
  appHeader?: {
    /**
    * Hide the Namespace location
    */
    hideNamespaceLocation?: boolean;
  },

  sideBar? :{
        /**
    * Control page links
    */
    navigation?: {
      /**
       * The route that the product will lead to if click on in navigation.
       */
      to?: PluginRouteRecordRaw;
    }
  }

  /**
  * TODO: RC jsdoc
  */
  sideMenu?: {
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
  }

    /**
   * Leaving these here for completeness but I don't think these should be advertised as useable to plugin creators.
   */
  // ifHaveVerb: string | RegExp;
  // removable: string;
  // showWorkspaceSwitcher: boolean;
  // supportRoute: string;
  // typeStoreMap: string;
};
