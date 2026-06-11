import { PluginRouteRecordRaw } from '@shell/core/types';

/**
 * TODO: RC jsdoc
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
   * A number used to determine where in navigation this item will be placed. The highest number will be at the top of the list.
   */
  weight?: number;

  /**
   * The route that the product will lead to if click on in navigation.
   */
  to?: PluginRouteRecordRaw;

  /**
   * Product name
   */
  name: string;

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
   * Leaving these here for completeness but I don't think these should be advertised as useable to plugin creators.
   */
  // ifHaveVerb: string | RegExp;
  // removable: string;
  // showWorkspaceSwitcher: boolean;
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
}

/**
 * interface for type-map's' definition for table headers/columns
 */
export interface TableColumn {
  name: string,
  label?: string,
  value: any,
  sort?: string | string[],
  formatter?: string,
  formatterOpts?: any,
  width?: number,
  tooltip?: string,
  search?: string | boolean,
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
