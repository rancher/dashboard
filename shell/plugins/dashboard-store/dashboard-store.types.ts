/**
 * Pagination settings sent to actions and persisted to store
 */
export interface OptPagination {
  namespaces?: string[];
  page: number,
  pageSize: number,
  sort: { field: string, asc: boolean }[],
  filter: { field: string, value: string }[]
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

export type FindAllOpt = {
  [key: string]: any,
  namespaced?: string[],
  pagination?: OptPagination,
}
