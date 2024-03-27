export interface OptPaginationSort { field: string, asc: boolean }
export interface OptPaginationFilter { field: string, value: string, notEqual: boolean }

/**
 * Pagination settings sent to actions and persisted to store
 */
export interface OptPagination {
  namespaces?: string[];
  page: number,
  pageSize: number,
  sort: OptPaginationSort[],
  /**
   * Filters can either be in the form
   * - filter=a=1,b=2,c=3
   *   - equates to entries in child arrays are `,` together
   * - filter=a=1&filter=b=2&filter=c=3
   *   - equates to level arrays are `&`d together
   */
  filter: OptPaginationFilter[][],
}

/**
 * Object persisted to store
 */
export interface StorePagination {
  request: OptPagination,
  result: {
    count: number,
    pages: number
  }
}

export type CoreFindOpt = {
  // [key: string]: any,
  type: string,
  force?: boolean,
}

/**
 * Args used for findAll action
 */
export interface FindAllOpt extends CoreFindOpt {
  watch?: boolean,
  namespaced?: string[],
  incremental?: boolean,
  hasManualRefresh?: boolean,
  limit?: number,
}

/**
 * Args used for findPage action
 */
export interface FindPageOpt extends CoreFindOpt {
  pagination: OptPagination,
  hasManualRefresh?: boolean,
}
