import { PaginationArgs } from '@shell/types/store/pagination.types';

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
   * Result of request is transient and not persisted to store
   */
  transient?: boolean,
  hasManualRefresh?: boolean,
}
