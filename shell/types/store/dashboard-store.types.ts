export interface OptPaginationSort { field: string, asc: boolean }

/**
 * Pagination settings sent to actions and persisted to store
 */
export interface OptPagination {
  namespaces?: string[];
  page: number,
  pageSize: number,
  sort: OptPaginationSort[],
  filter: { field: string, value: string }[],
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
