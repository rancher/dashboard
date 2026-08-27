import { PluginRouteRecordRaw } from '@shell/core/types';

/**
 * Translation keys for the nav toolbar's labels, so a product can word the
 * search for what its nav actually contains. Anything left out keeps the
 * default, which is written to suit any product.
 */
export interface NavSearchLabels {
  /** Placeholder in the search input. */
  placeholder?: string;
  /** Title attribute on the search input, given the keyboard shortcut. */
  tooltip?: string;
  /** Accessible name for the search input. */
  ariaLabel?: string;
  /** Shown in place of the list when nothing matches. */
  noResults?: string;
  /** Heads the default list before anything has been jumped to. */
  popularHeading?: string;
  /** Heads the default list once there is history to show. */
  recentHeading?: string;
}

/**
 * The product as seen by the type-map
 */
export interface TypeMapProduct {
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
  icon?: string;

    /**
   * Alternative to the icon property. Uses require
   */
  svg?: Function;

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

  /**
   * The vuex store that this product should use by default i.e. 'management'
   */
  inStore?: string;

  /**
   * Show the cluster switcher in the navigation
   */
  showClusterSwitcher?: boolean;

  /**
   * Indicates whether UI Extensions can add pages to this product
   */
  extendable?: boolean;

  /**
   * Show the namespace filter in the header
   */
  showNamespaceFilter?: boolean;

  /**
   * Show the nav toolbar (the jump-to search and the collapse-all control) for
   * this product. Off by default: the search is only worth its place in a
   * product with a nav big enough to get lost in.
   *
   * `true` uses the default labels. Pass an object to enable it and override
   * individual labels, whose values are translation keys, so a product does not
   * inherit wording that does not fit it (the default "last used" heading says
   * nothing about clusters; the explorer overrides it to say it does).
   */
  navSearch?: boolean | NavSearchLabels;

  /**
   * A number used to determine where in navigation this item will be placed. The highest number will be at the top of the list.
   */
  weight?: number;

  /**
   * The route that the product will lead to if click on in navigation.
   */
  to?: PluginRouteRecordRaw;

  /**
   * Product name
   *
   * Defaults to the DSL fn product arg
   */
  name?: string;

  /**
   *
   */
  label?: string;

  labelKey?: string;

  iconHeader?: string;

  // Do not use - internal use only
  version?: number;

  renameGroups?: {
    /** String or regex to match against group internal IDs */
    groupSelector: RegExp | string;
    /** Display name to use for matching groups */
    newName: string;
  }[];

  moveToGroup?: {
    /** Page identifier — the resource `type` string or the custom page `name` */
    entryId: string;
    /** Target group name as defined in your group config (`name` property) */
    groupName: string;
    /** Ordering weight for the mapping (default: 5). Higher weight takes precedence when multiple rules match */
    weight?: number;
  }[];

  ignoreGroups?: {
    /** String or regex to match against group names */
    groupSelector: string | RegExp;
    /** Optional conditional function that accepts the root Dashboard Vuex store getters and returns true if the group should be ignored */
    condition?: (getters: any) => boolean;
  }[];

  /**
   * Whether the product can be removed by users (default: false — products are built-in/not removable unless explicitly set to true)
   */
  removable?: boolean;
  /**
   *  controls whether a workspace switcher dropdown appears in the header (instead of the namespace filter) if set to true
   */
  showWorkspaceSwitcher?: boolean;

  /**
   * Leaving these here for completeness but I don't think these should be advertised as useable to plugin creators.
   */
  // ifHaveVerb: string | RegExp;
  // supportRoute: string;
  // typeStoreMap: string;
}

/**
 * Used by type-map configureType
 */
export interface TypeMapConfigureType {
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
  customRoute?: PluginRouteRecordRaw | Object;
  /** Hide this type from the nav/search bar on downstream clusters (will only show in "local" cluster) */
  localOnly?: boolean;
  // resource: undefined; // Use this resource in ResourceDetails instead
  // resourceDetail: undefined; // Use this resource specifically for ResourceDetail's detail component
  // resourceEdit: undefined; // Use this resource specifically for ResourceDetail's edit component
  /**
   * Use this to depaginate requests for this type
   */
  depaginate?: undefined;
  // notFilterNamespace: undefined; // Define namespaces that do not need to be filtered
  // used in configureType options, to be typed later if needed

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

/**
 * Used by type-map virtualType
 */
export interface TypeMapVirtualType {
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
  name: string;
  // /** Name of the page (unique identifier) */
  // name?: string;
  /** Entry route definition for this custom page */
  route?: PluginRouteRecordRaw | Object;
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
  /**
   * `navResources` is an optional array of resource types. The nav item stays
   * highlighted while on a route for one of those resources. For example, some
   * create/edit pages of a type have no nav entry of their own.
   */
  navResources?: string[];
}

/**
 * interface for type-map's' definition for table headers/columns
 */
export interface TableColumn {
  name: string,
  label?: string,
  value?: any,
  sort?: string | string[],
  formatter?: string,
  formatterOpts?: any,
  width?: number,
  tooltip?: string,
  search?: string | string[] | boolean,
}

export const COLUMN_BREAKPOINTS = {
  /**
   * Only show column if at tablet width or wider
   */
  TABLET:  'tablet',
  /**
   * Only show column if at laptop width or wider
   */
  LAPTOP:  'laptop',
  /**
   * Only show column if at desktop width or wider
   */
  DESKTOP: 'desktop'
};
