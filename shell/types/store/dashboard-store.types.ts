import { KubeLabelSelector } from '@shell/types/kube/kube-api';
import { PaginationArgs, StorePagination } from '@shell/types/store/pagination.types';

/**
 * @internal
 * Core properties on all findX actions
 */
export type ActionCoreFindOptions = {
  /**
   * Use this to override URL instead of looking up the URL for the type/id
   */
  url?: string,
  /**
   * Force the request to go to the server instead of checking for a cached value first
   */
  force?: boolean,
}

/**
 * @internal
 * Args used for find action
 */
export interface ActionFindArgs extends ActionCoreFindOptions {
  /**
   * Watch for changes
   *
   * false = no, all other values = yes
   */
  watch?: boolean,
  /**
   * @internal
   * Whether to invalidate the page cache (default: false)
   */
  invalidatePageCache?: boolean,
  /**
   * XHR request verbs `get`, `post`, `put`, `delete` (default: get)
   */
  method?: string,
  /**
   * Used if we want to specify custom headers for the request
   */
  headers?: object,
  /**
   * Use this to override URL instead of looking up the URL for the type/id
   */
  url?: string,
}

/**
 * @internal
 * Args used for findAll action
 */
export interface ActionFindAllArgs extends ActionCoreFindOptions {
  /**
   * Watch for changes
   *
   * false = no, all other values = yes
   */
  watch?: boolean,
  /**
   * Array of namespaces to filter by (used in url path, not part of pagination params)
   */
  namespaced?: string[],
  /**
   * @internal
   * Properties that determine and control if resources should be fetched in increments
   */
  incremental?: {
    /**
     * load this amount of info first, to show something quickly
     *
     * helpful if resources per increments turns out to be large
     */
    quickLoadCount: number,
    /**
     * Number of resources to fetch in each increment
     */
    resourcesPerIncrement: number,
    /**
     * Number of increments to fetch
     */
    increments: number,
    /**
     * Fetch increments by page size and number (instead of limit and next)
     */
    pageByNumber: boolean,
  },
  /**
   * @internal
   * Flag to indicate if this request is coming from a list with manual refresh, which may require different handling in the store
   */
  hasManualRefresh?: boolean,
  /**
   * Number of records to return per page
   */
  limit?: number,
  /**
   * @internal
   * Iterate over all pages and return all resources. This is done via the native kube pagination api, not Steve
   */
  depaginate?: boolean,
  /**
   * @internal
   * Specifies the name to use if we should save the count returned in the paginated request
   */
  saveCountAs?: string,
}

/**
 * @internal
 * Args used for findPage action
 */
export interface ActionFindPageArgs extends ActionCoreFindOptions {
  /**
   * Set of pagination settings that creates the url.
   *
   * This is stored and can be used to compare in new request to determine if we already have this page
   */
  pagination: PaginationArgs,
  /**
   * The single namespace to filter by (used in url path, not part of pagination params)
   */
  namespaced?: string,
  /**
   * Watch for changes
   *
   * false = no, all other values = yes
   */
  watch?: boolean,
  /**
   * @internal
   * Does this request stem from a list with manual refresh?
   */
  hasManualRefresh?: boolean,
  /**
   * If true don't persist the http response to the store, just pass it back
   */
  transient?: boolean,

  /**
   * @internal
   * Specifies the name to use if we should save the count returned in the paginated request
   */
  saveCountAs?: string,

  /**
   * When making a supporting HTTP request include associated resource data
   */
  includeAssociatedData?: boolean,

  /**
   * The target minimum revision for the resource.
   *
   * If this is higher than the latest revision known to rancher then an error will be returned
   */
  revision?: string
}

/**
 * @internal
 * Response to the find action
 * resource object returned by the API, or null if not found
 */
export type ActionFindResponse<T = any> = T;

/**
 * @internal
 * Response to a transient (not stored in cache) findPage action
 */
export type ActionFindPageTransientResponse<T = any> = {
  data: T[],
  pagination?: StorePagination
};

/**
 * @internal
 * Response to the findPage action
 *
 * If the request was transient (not stored in cache) this will be an object contain all the details of the request
 *
 * If the request was not transient this will just be the array of resources
 */
export type ActionFindPageResponse<T = any> = ActionFindPageTransientResponse | T[];

/**
 * Args used for findMatching action
 */
export interface ActionFindMatchingArgs extends ActionCoreFindOptions {
  /**
   * Represents the label selector to filter by
   * @example
   * ```
   * {
   *   matchLabels: {
   *     app: 'my-app',
   *     tier: 'frontend'
   *   },
   *   matchExpressions: [
   *     {
   *       key: 'environment',
   *       operator: 'In',
   *       values: ['production', 'staging']
   *     }
   *   ]
   * }
   * ```
   */
  labelSelector: KubeLabelSelector,
  /**
   * The single namespace to filter by (used in url path, not part of pagination params)
   */
  namespaced?: string,
  /**
   * @internal
   * Iterate over all pages and return all resources.
   */
  depaginate?: boolean
}

/**
 * @internal
 * Response to the findMatching action
 */
export type ActionFindMatchingResponse<T = any> = ActionFindPageResponse<T>

/**
 * @internal
 * Args used for findLabelSelector action
 */
export type ActionFindLabelSelectorArgs = Omit<ActionFindPageArgs, 'pagination' | 'namespace'> | ActionFindMatchingArgs;
