import type { RouteComponent, RouteRecordRaw } from 'vue-router';
import type { HeadersConfig } from './column-builder';
import type { PluginRouteRecordRaw } from './types';
import { NAME as EXPLORER_PROD_NAME } from '@shell/config/product/explorer.js';
import { NAME as CLUSTER_MAN_PROD_NAME } from '@shell/config/product/manager.js';
import { NAME as SETTINGS_PROD_NAME } from '@shell/config/product/settings.js';
import { NAME as AUTH_PROD_NAME } from '@shell/config/product/auth.js';

type Async<T> = () => Promise<T>;

/**
 * Represents a navigation/route for defined as entry point for a custom page in a product
 */
export type RouteRecordRawWithParams = Omit<RouteRecordRaw, 'path'> & {
  /** Path for route - can include dynamic segments like ':id'. Based on vue-router routes */
  path?: string;
  /** Params for route - key-value pairs representing route parameters */
  params?: Record<string, any>;
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
export enum StandardProductName {
  // eslint-disable-next-line no-unused-vars
  EXPLORER = EXPLORER_PROD_NAME,
  // eslint-disable-next-line no-unused-vars
  MANAGER = CLUSTER_MAN_PROD_NAME,
  // eslint-disable-next-line no-unused-vars
  SETTINGS = SETTINGS_PROD_NAME,
  // eslint-disable-next-line no-unused-vars
  AUTH = AUTH_PROD_NAME,
}

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
  | { label: string; labelKey?: string }
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
  /** Translation key for the label */
  labelKey?: string;
  /** Name of the page (unique identifier) */
  name?: string;
  /** Entry route definition for this custom page */
  route?: RouteRecordRaw | PluginRouteRecordRaw | Object;
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
  customRoute?: RouteRecordRaw;
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
 * Represents a page item (custom page or resource page) in a product's config
 * - For custom pages: use `component` with `name` and `label`/`labelKey`
 * - For resource pages: use `type` with optional `config` and `headers`
 */
export type ProductChildPage =
  | (ProductChildMetadata & {
      /** Component to render for this custom page */
      component: RouteComponent | Async<RouteComponent>;
      type?: never;
      headers?: never;
      /** Optional configuration for the page */
      config?: VirtualTypeConfiguration;
      /** Ordering weight for this page among its siblings */
      weight?: number;
    })
  | ({
      label?: never;
      labelKey?: never;
      name?: never;
      /** K8s resource type name for a resource page */
      type: string;
      component?: never;
      /** Optional configuration for the resource page */
      config?: ConfigureTypeConfiguration;
      /** Ordering weight for this page among its siblings */
      weight?: number;
      /**
       * Table column configuration for this resource type.
       * Use standard column keys, builder pattern, or custom config.
       * @example
       * headers: { preset: 'namespaced', pagination: 'auto' }
       * @example
       * headers: { columns: ['state', 'name', column('targetPort').noSort(), 'age'] }
       */
      headers?: HeadersConfig;
    });

/**
 * Represents a product child in the navigation
 * This can be a type, a group, or a route.
 */
export type ProductChild = ProductChildGroup | ProductChildPage; // eslint-disable-line no-use-before-define

/**
 * Represents a group of child pages in a product configuration
 */
export type ProductChildGroup = ProductChildMetadata & {
  component?: RouteComponent | Async<RouteComponent>;
  children: ProductChild[];
  /** Default child to navigate to */
  default?: string;
};

/**
 * Represents the allowed configuration for a product
 */
export type ProductMetadata = {
  /**
   * Product name (unique indentifier)
   */
  name: string;
  /**
   * The icon that should be displayed beside this item in the navigation.
   */
  icon?: string;
  /**
   * Alternative to the icon property. Use require to reference an SVG file
   */
  svg?: Function;
  /**
   * The category this product belongs under. i.e. 'config', default is 'global'
   */
  category?: string;
  /** Ordering weight for the product, if applicable */
  weight?: number;
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
  component: RouteComponent | Async<RouteComponent>;
};
