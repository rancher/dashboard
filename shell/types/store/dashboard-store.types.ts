import { KubeLabelSelector } from '@shell/types/kube/kube-api';
import { PaginationArgs, StorePagination } from '@shell/types/store/pagination.types';

/**
 * Properties on all findX actions
 */
export type ActionCoreFindArgs = {
  url?: string,
  force?: boolean,
}

/**
 * Args used for findAll action
 */
export interface ActionFindAllArgs extends ActionCoreFindArgs {
  watch?: boolean,
  namespaced?: string[],
  /**
   * Should resources be fetched in increments?
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
  hasManualRefresh?: boolean,
  limit?: number,
  /**
   * Iterate over all pages and return all resources.
   *
   * This is done via the native kube pagination api, not steve
   */
  depaginate?: boolean,
}

/**
 * Args used for findPage action
 */
export interface ActionFindPageArgs extends ActionCoreFindArgs {
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
   * Does this request stem from a list with manual refresh?
   */
  hasManualRefresh?: boolean,
  /**
   * If true don't persist the http response to the store, just pass it back
   */
  transient?: boolean,
  /**
   * The target minimum revision for the resource.
   *
   * If this is higher than the latest revision known to rancher then an error will be returned
   */
  revision?: string
}

/**
 * Response to a transient (not stored in cache) findPage action
 */
export type ActionFindPageTransientResponse<T = any> = {
  data: T[],
  pagination?: StorePagination
};

/**
 * Response to the findPage action
 *
 * If the request was transient (not stored in cache) this will be an object contain all the details of the request
 *
 * If the request was not transient this will just be the array of resources
 */
export type ActionFindPageResponse<T = any> = ActionFindPageTransientResponse | T[];

/**
 * Args used for findPage action
 */
export interface ActionFindMatchingArgs extends ActionCoreFindArgs {
  labelSelector: KubeLabelSelector,
  namespaced?: string,
  depaginate?: boolean
}

/**
 * Response to the findMatching action
 */
export type ActionFindMatchingResponse<T = any> = ActionFindPageResponse<T>

/**
 * Args used for findLabelSelector action
 */
export type ActionFindLabelSelectorArgs = ActionFindPageArgs | ActionFindMatchingArgs;
