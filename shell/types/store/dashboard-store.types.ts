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

/**
 * Args used for findAll action
 */
export type FindAllOpt = {
  [key: string]: any,
  namespaced?: string[],
  pagination?: OptPagination,
}
