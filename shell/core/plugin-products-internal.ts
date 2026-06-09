import {
  ProductMetadataAdd, ProductMetadataInternal, ProductMetadataSinglePage, ProductMetadataSinglePageComponent, VueRouteComponent
  , ProductChildResourcePage as ProductChildResourcePageExternal, ProductChildCustomPage as ProductChildCustomPageExternal
  ProductChild,
  ProductChildMetadata,
  ProductChildResourcePage,
} from '@shell/core/plugin-products-external';
import { RouteRecordRawWithParams } from '@shell/core/plugin-types';
import { HeaderOptions, PaginationHeaderOptions, PluginRouteRecordRaw } from '@shell/core/types';

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

// TODO: RC location (type-map types)
/**
 * Represents the allowed configuration for a custom page (virtualType)
 */
export interface VirtualTypeConfiguration {
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
 * Metadata for route generation to a product overview page
 */
export type OverviewPageRoutingMetadata = {
  /** Name of the overview page */
  name: string;
  /** Component to render for the overview page */
  component: VueRouteComponent;
}

// -----
export type ProductMetadataAddInternal = ProductMetadataAdd & ProductMetadataInternal;

// TODO: RC where live
export interface ProductTypeMap {
  /**
   * The category this product belongs under. i.e. 'config'
   */
  category?: string; // TODO: RC

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
  icon?: string; // TODO: RC

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
   * Alternative to the icon property. Uses require
   */
  svg?: Function;

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

// export class ProductOptions implements ProductOptionsTypeMap {
//   category?: string;
//   hideCopyConfig?: boolean;
//   hideKubeConfig?: boolean;
//   hideKubeShell?: boolean;
//   hideNamespaceLocation?: boolean;
//   hideSystemResources?: boolean;
//   icon?: string;
//   ifFeature?: string | RegExp;
//   ifHave?: string;
//   ifHaveGroup?: string | RegExp;
//   ifHaveType?: string | RegExp;
//   ifNotHaveType?: string | RegExp;
//   inStore?: string;
//   showClusterSwitcher?: boolean;
//   extendable?: boolean;
//   showNamespaceFilter?: boolean;
//   weight?: number;
//   to?: PluginRouteRecordRaw;
//   svg?: Function;
//   name: string;
//   label?: string;
//   labelKey?: string;
//   iconHeader?: string;
//   version?: number;

//   /**
//    *
//    */
//   constructor(options: ProductMetadataAdd) {
//     const po = options as ProductMetadata;

//     this.name = po.name;

//     this.ifFeature = po.show?.ifFeature;
//     this.ifHave = po.show?.ifHave;
//     this.ifHaveGroup = po.show?.ifHaveGroup;
//     this.ifHaveType = po.show?.ifHaveType;
//     this.ifNotHaveType = po.show?.ifHaveType;

//     this.to = po.navigation?.to;

//     this.hideSystemResources = po.resources?.hideSystemResources;
//     this.inStore = po.resources?.vuexStore;

//     this.extendable = po.extendable;

//     const poI = options as ProductMetadataInternal;

//     this.category = poI.category;
//     this.hideNamespaceLocation = poI.hideNamespaceLocation;
//     this.version = poI.version;

//     const poA = options as ProductMetadataAdd;

//     this.hideCopyConfig = poA.pageHeader?.hideCopyConfig;
//     this.hideKubeConfig = poA.pageHeader?.hideKubeConfig;
//     this.hideKubeShell = poA.pageHeader?.hideKubeShell;
//     this.showClusterSwitcher = poA.pageHeader?.showClusterInfo;
//     this.showNamespaceFilter = poA.pageHeader?.showNamespaceFilter;
//     this.iconHeader = poA.pageHeader?.showNamespaceFilter;

//     this.icon = poA.pageSideBar?.icon;
//     this.svg = poA.pageSideBar?.icon?.svg;

//     const poE = options as ProductOptionsExtend;

//     // -- Both
//     this.weight = poA.pageSideBar?.weight || poE.resourceMenu?.weight;

//     this.label = '';
//     this.labelKey = '';
//   }
// }

// export class ProductOptionsSinglePage extends ProductOptions implements ProductMetadataSinglePageComponent {
//   component: VueRouteComponent;

//   constructor(singlePage: ProductMetadataSinglePage) {
//     super(singlePage);
//     this.component = singlePage.component;
//   }
// }

// -----

// TODO: RC ProductChildCustomPage find all, reference this one

// export class ProductChildCustomPage implements ProductChildMetadata {


//   /** Product name/unique identifier for the product */
//   name: string;
//   /** Ordering weight for the among its siblings, if applicable */
//   weight?: number;
//    /** Human-readable label for the product
//    * Either label or labelKey are required */
//   label?: string;
//    /** Human-readable label for the product
//    * Either label or labelKey are required */
//   labelKey?: string;

//   /** Component to render for this custom page */
//   component: VueRouteComponent;
//   /** Optional configuration for the page */
//   config?: VirtualTypeConfiguration;

//   constructor(virtualPage: ProductChildCustomPageExternal) {
//     this.name = virtualPage.name
//     this.weight = virtualPage.weight;
//     this.label = virtualPage.label;
//     this.labelKey = virtualPage.labelKey;
//     this.component = virtualPage.component;
//     this.config = {
//       ifHave:              virtualPage.show?.ifHave,
//       ifFeature:           virtualPage.show?.ifFeature,
//       ifHaveType:          virtualPage.show?.ifHaveType,
//       ifHaveVerb:          virtualPage.show?.ifHaveVerb,
//       route:               virtualPage.navigation?.customRoute,
//       namespaced:          virtualPage.resource?.namespaced,
//       weight:              virtualPage.weight,
//       exact:               virtualPage.navigation?.exact,
//       overview:            virtualPage.display?.overview,
//       'exact-path':        virtualPage.navigation?.['exact-path'],
//     }
//   }
// }


// TODO: RC location
export interface ConfigureTypeConfiguration {
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

// ---
export type ProductChildResourcePageInternal = ProductChildResourcePage & {
  lists: {
    /** Table headers for this resource type (client-side pagination) */
    localHeaders?: PaginationHeaderOptions[];
  }

  resourceMenu: {
    /** Whether to hide this resource from the side-menu entirely */
    hideFromNav?: boolean;
  }
}

// ---
/**
 * Represents the allowed configuration for a resource page (configureType)
 */
// type ConfigureTypeConfiguration = {
//   /** Override for the name displayed */
//   displayName?: string;
//   /** Override for the create button string on a list view */
//   listCreateButtonLabelKey?: string;
//   /** If false, disable create even if schema says it's allowed */
//   isCreatable?: boolean;
//   /** If false, disable for edit */
//   isEditable?: boolean;
//   /** If false, disable for remove/delete */
//   isRemovable?: boolean;
//   /** If false, hide state in columns and masthead */
//   showState?: boolean;
//   /** If false, hide age in columns and masthead */
//   showAge?: boolean;
//   /** If false, hide masthead config button in view mode */
//   showConfigView?: boolean;
//   /** If false, hide masthead in list view */
//   showListMasthead?: boolean;
//   /** If false, cannot edit or show yaml */
//   canYaml?: boolean;
//   /** Show the Masthead in the edit resource component */
//   resourceEditMasthead?: boolean;
//   /** Entry route definition for this resource page */
//   customRoute?: RouteRecordRawWithParams;
//   /** Hide this type from the nav/search bar on downstream clusters (will only show in "local" cluster) */
//   localOnly?: boolean;
//   // resource: undefined; // Use this resource in ResourceDetails instead
//   // resourceDetail: undefined; // Use this resource specifically for ResourceDetail's detail component
//   // resourceEdit: undefined; // Use this resource specifically for ResourceDetail's edit component
//   // depaginate: undefined; // Use this to depaginate requests for this type
//   // notFilterNamespace: undefined; // Define namespaces that do not need to be filtered
//   // used in configureType options, to be typed later if needed
//   // listGroups: [
//   //       {
//   //         icon:       'icon-role-binding',
//   //         value:      'node',
//   //         field:      'roleDisplay',
//   //         hideColumn: ROLE.name,
//   //         tooltipKey: 'resourceTable.groupBy.role'
//   //       }
//   //     ]
// }

/**
 * Represents a resource page with a type (K8s resource)
 */
// export class ProductChildResourcePage {
//   /** K8s resource type name for a resource page */
//   type: string;
//   /** Optional configuration for the resource page */
//   config?: ConfigureTypeConfiguration;
//   /** Ordering weight for this page among its siblings */
//   weight?: number;
//   /** Use this to override the resource name used in the list view for this type */
//   overrideListResourceName?: string;
//   /** Whether to hide this resource from the side-menu entirely */
//   hideFromNav?: boolean;
//   /** Whether to hide bulk actions for this resource */
//   hideBulkActions?: boolean;
//   /** Table headers for this resource type (client-side pagination) */
//   headers?: HeaderOptions[];
//   /** Table headers for this resource type (server-side pagination) */
//   sspHeaders?: PaginationHeaderOptions[];

//   constructor(resourcePage: ProductChildResourcePageExternal) {
//     this.type = resourcePage.type;
//     this.config = {
//       displayName:              resourcePage.display?.displayName,
//       listCreateButtonLabelKey: resourcePage.lists?.listCreateButtonLabelKey,
//       isCreatable:              resourcePage.actions?.isCreatable,
//       isEditable:               resourcePage.actions?.isEditable,
//       isRemovable:              resourcePage.actions?.isRemovable,
//       showState:                resourcePage.display?.showState,
//       showAge:                  resourcePage.display?.showAge,
//       showConfigView:           resourcePage.display?.showConfigView,
//       showListMasthead:         resourcePage.display?.showListMasthead,
//       canYaml:                  resourcePage.actions?.canYaml,
//       resourceEditMasthead:     resourcePage.display?.resourceEditMasthead,
//       customRoute:              resourcePage.navigation?.customRoute,
//       localOnly:                resourcePage.display?.localOnly,
//     };
//     this.weight = resourcePage.resourceMenu?.weight;
//     this.overrideListResourceName = resourcePage.lists?.overrideListResourceName;
//     this.hideBulkActions = resourcePage.lists?.hideBulkActions;
//     this.sspHeaders = resourcePage.lists?.headers;
//   }
// }

