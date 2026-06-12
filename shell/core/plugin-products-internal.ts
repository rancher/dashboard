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
  /**
   * @internal
   * Whether the route should start with the product name or not (e.g. "my-product/c/:cluster/:resource" vs "c/:cluster/my-product/:resource")
   * only to be used in very special usecases (internal use only - check FLEET product config for an example)
   * */
  startRouteWithProduct?: boolean;
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
  /** Control how all lists that show this resource behave  */
  listConfig?: {
    /** Table headers for this resource type (client-side pagination) */
    localHeaders?: PaginationHeaderOptions[];

    /**
     * Whether this custom page has list groups (definition for grouping items in the list view)
     */
    listGroups?: {
      /** Icon for the group (relates to icons in rancher-icons */
      icon?: string;
      /** Value for the group (used for grouping items in the list view) */
      value?: string;
      /** Field for the group (used for grouping items in the list view) */
      field?: string;
      /** Column to hide when this group is active */
      hideColumn?: string;
      /** Tooltip key for the group */
      tooltipKey?: string;
    }[];

    /**
     * Whether the provided list groups will override the default grouping options (e.g. group by namespace, group by cluster, etc.) or be added to them
     */
    listGroupsWillOverride?: boolean;

    /**
    * Use this to configure subtypes that should be shown in the list view for this type (e.g. show "pods" and "deployments" in the list view for "workloads")
    */
    subTypes?: string[];
  }

  /** Control how the child displays in the side menu  */
  sideMenu?: {
    /** Whether to hide this resource from the side-menu entirely */
    hideFromNav?: boolean;
  }

  /** Control how resources are handled in this product */
  resource?: {
   /**
   * When requests are made to fetch this resource, outside of paginated requests, and they are paged.. iteratively fetch all pages
   *
   * We want to move away from this and use one of the new paginated requests to only fetch the data we need
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

  /** Control what appears in the UI's main application header */
  appHeader?: {
    /**
    * Hide the Namespace location
    */
    hideNamespaceLocation?: boolean;
    /**
    *  controls whether a workspace switcher dropdown appears in the header (instead of the namespace filter) if set to true
    */
    showWorkspaceSwitcher?: boolean;
  },

  /**
  * Control what appears in the vertical side bar on the left of the UI
  */
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

  /** Control how the child displays in the side menu  */
  sideMenu?: {
    /**
     * @internal
     * Use `renameGroups` on the product metadata to remap group display names in the side-menu. Each entry matches a group's internal ID (via string or regex) and replaces its display label with a new name. This only changes how the group is labelled in the UI — it does not move resources between groups.
     *
     * The `groupSelector` is evaluated against group internal IDs. It can be an exact string or a `RegExp` pattern. The `newName` value is the new display name.
     *
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
     */
    ignoreGroups?: {
      /** String or regex to match against group names */
      groupSelector: string | RegExp;
      /** Optional conditional function that accepts the root Dashboard Vuex store getters and returns true if the group should be ignored */
      condition?: (getters: any) => boolean;
    }[]
  }

  /**
   * Whether the product can be removed by users (default: false — products are built-in/not removable unless explicitly set to true)
   */
  removable?: boolean;

    /**
   * Leaving these here for completeness but I don't think these should be advertised as useable to plugin creators.
   */
  // ifHaveVerb: string | RegExp;
  // supportRoute: string;
  // typeStoreMap: string;
};
