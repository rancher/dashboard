import { ProductFunction } from '@shell/core/plugin';
import { HeaderOptions } from '@shell/core/types';
import { NAME as EXPLORER_PROD_NAME } from '@shell/config/product/explorer.js';
import { NAME as CLUSTER_MAN_PROD_NAME } from '@shell/config/product/manager.js';
import { NAME as SETTINGS_PROD_NAME } from '@shell/config/product/settings.js';
import { NAME as AUTH_PROD_NAME } from '@shell/config/product/auth.js';
import { RouteComponent } from 'vue-router';

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

/**
 * Represents a Vue component or an async function that resolves to a Vue component, used for route components in product configuration
 */
export type VueRouteComponent = RouteComponent | Async<RouteComponent>;

// --------------  Page Related Resource --------------
// When updating external page types also update where they're converted to the internal page type
// i.e. `TypeMapVirtualType` or `TypeMapConfigureType` usage in shell/core/plugin-products-base.ts

/**
 * Type that enforces either a `label` or `labelKey`
 */
type LabelOrLabelKey = (
  /** Human-readable label for the product
   * Either label or labelKey are required */
  | { label: string; labelKey?: string }
  /** Translation key for the label of the product
   * Either label or labelKey are required */
  | { labelKey: string; label?: string }
)

/**
 * Represents a custom page with a component
 */
export type ProductChildCustomPage = LabelOrLabelKey & {
  /** Product name/unique identifier for the product */
  name: string;

  /** Component to render for this custom page */
  component: VueRouteComponent;

  /** Determine when this product is enabled and shown */
  enable?: {
    /** Display only if condition is met (relates to IF_HAVE in shell/store/type-map) */
    ifHave?: boolean;
    /** Display only if feature is present (relates to shell/store/features) */
    ifFeature?: string;
    /** Display only if resource type exists */
    ifHaveType?: string;
    /** Used in conjunction with "ifHaveType", display only if resource type allows this verb (GET, POST, PUT, DELETE) */
    ifHaveVerb?: string;
  };

  /** Control how the child displays in the side menu  */
  sideMenu?: {
    /** Ordering weight for this page among its siblings */
    weight?: number;
  }

  /** Control how resources are handled in this product */
  resource?: {
    /** Whether resources this page represents is namespaced */
    namespaced?: boolean;
  }
};

/**
 * Represents a resource page with a type (K8s resource)
 */
export type ProductChildResourcePage = {
  /** K8s resource type name for a resource page */
  type: string;

  /**
   * Optional. Override the label for this page
   */
  label?: string

  /** Control how the child displays in the side menu  */
  sideMenu?: {
    /** Ordering weight for this page among its siblings */
    weight?: number;
    /** Hide this type from the nav/search bar on downstream clusters (will only show in "local" cluster) */
    localOnly?: boolean;
  }

  /** Control how the product displays some information  */
  display?: {
    /** If false, hide state in columns and masthead */
    showState?: boolean;
    /** If false, hide age in columns and masthead */
    showAge?: boolean;
  }

  /** Control what actions and features can be carried out for this resource type */
  can?: {
    /** If false, disable create even if schema says it's allowed */
    create?: boolean;
    /** If false, disable for edit */
    edit?: boolean;
    /** If false, disable for remove/delete */
    remove?: boolean;
    /** If false, cannot edit or show yaml */
    yaml?: boolean;
  }

  /** Control how this resource behaves in resource list, detail and create/edit pages */
  views?: {

    /** Control how this resource behaves in a resource list page */
    list?: {
      /** Override for the create button string on a list view */
      createLabelKey?: string;

      /** If false, hide masthead in list view. Defaults to true */
      showListMasthead?: boolean;
    }

    /** Control how this resource behaves in a resource detail page */
    detail?: {
      /** If false, hide masthead config button in view mode. Defaults to true */
      showConfigView?: boolean;
    }

    /** Control how this resource behaves in a resource create/edit page */
    createEdit?: {
      /** Show the Masthead in the edit resource component. Defaults to true */
      showMasthead?: boolean;
    }
  }

  /** Control how all lists that show this resource behave  */
  listConfig?: {
    /** Table headers for this resource type (server-side pagination) */
    headers?: HeaderOptions[];
    /** Whether to hide bulk actions for this resource */
    hideBulkActions?: boolean;
  }
};

/**
 * Represents a page item (custom page or resource page) in a product's config
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
export type ProductChildGroup = LabelOrLabelKey & {
  /** Product name/unique identifier for the product */
  name: string;

  /** Component to render for this group */
  component?: VueRouteComponent;

  /** Control how the child displays menu items in the side menu  */
  sideMenu: {
    /**
    * Add entries to the side menu
    */
    children: ProductChild[];
    /** Ordering weight for this group among its siblings */
    weight?: number;
    /** Default child to navigate to */
    default?: string;
  }
};

// --------------  Product Related Resource --------------

// When updating external product types also update where they're converted to the internal product type
// i.e. `TypeMapProduct` usage in shell/core/plugin-products-base.ts

/**
 * Represents the allowed configuration for a product
 */
type _ProductMetadata = LabelOrLabelKey & {
  /**
   * Product name (unique identifier)
   */
  name: string;

  /**
   * Control conditions on when to show the product
   */
  enable?: {
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

  /** Control what appears in the UI's main application header */
  appHeader?: {
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
    */
    showClusterInfo?: boolean;

    /**
     * Show the namespace filter in the header
     */
    showNamespaceFilter?: boolean;

    /**
     * Show a product icon in the header
     */
    icon?: string;
  },

  /**
   * Control what appears in the vertical side bar on the left of the UI
   */
  sideBar?: {
    /**
     * A number used to determine where in navigation this item will be placed. The highest number will be at the top of the list.
     */
    weight?: number;

    /**
     * The icon to display in the side bar for this product
     */
    icon: {
      /**
      * Icon pack name
      */
      name?: string;

      /**
       * Alternative to the icon property. Uses require
       */
      svg?: Function;
    },

  }

  /**
   * Control how resources are fetched, filtered and stored
   */
  resources?: {
    /**
     * Hide the system resources in lists
     */
    hideSystemResources?: boolean;
  }

  /**
   * Indicates whether UI Extensions can add pages to this product
   */
  extendable?: boolean;
}

export type ProductMetadata = _ProductMetadata

/**
 * Represents a single page product, which is a product that only has one page and
 * therefore does not need to be represented in the navigation as a group with children.
 */
export type ProductMetadataSinglePage = ProductMetadata & {
  /** Component to render for this product (single page product) */
  component: VueRouteComponent;
};

// --------------  Extension methods --------------

export interface IExtensionProducts {
  /**
   * Register a top-level product as a flag on the plugin
   * @internal - DO NOT USE - Internal API only
   */
  _registerTopLevelProduct(): void;

  /**
   *
   * @internal - DO NOT USE - Internal API only
   */
  _setStartRouteWithProduct(value: boolean): void;

  /**
   * Add a product to the sidebar, with children and a side menu for navigation for internal pages
   * @param product
   * @param sideMenu Pages associated with the product. These will appear in the side menu
   */
  addProduct(product: ProductMetadata, sideMenu: ProductChildPage[]): void;
  addProduct(product: ProductMetadata, sideMenu: ProductChildGroup[]): void;
  addProduct(product: ProductMetadata, sideMenu: ProductChild[]): void;

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
   *
   * Once other `addProduct` signatures reach maturity this will be deprecated
   * @param importFn Function that will import the module containing a product definition
   */
  addProduct(importFn: ProductFunction): void;

  /**
   * Extend an existing product in Rancher, with children and a side menu for navigation for internal pages
   *
   * @param productName Name of the product to be extended
   * @param sideMenu Pages that will be added to the product. These will appear in the side menu
   */
  extendProduct(productName: StandardProductName | string, sideMenu: ProductChildPage[]): void;
  extendProduct(productName: StandardProductName | string, sideMenu: ProductChildGroup[]): void;
  extendProduct(productName: StandardProductName | string, sideMenu: ProductChild[]): void;
}
