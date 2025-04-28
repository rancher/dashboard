import { StorePaginationResult } from '@shell/types/store/pagination.types';

/**
 * see {@link PagTableFetchSecondaryResources}
 */
export type PagTableFetchSecondaryResourcesOpts = { canPaginate: boolean }
/**
 * see {@link PagTableFetchSecondaryResources}
 */
export type PagTableFetchSecondaryResourcesReturns = Promise<any>
/**
 * Function to fetch resources that are required to supplement information needed by rows in a PaginatedResourceTable
 *
 * Used in scenarios where ALL resources are expected
 */
export type PagTableFetchSecondaryResources = (opts: PagTableFetchSecondaryResourcesOpts) => PagTableFetchSecondaryResourcesReturns

/**
 * see {@link PagTableFetchPageSecondaryResources}
 */
export type PagTableFetchPageSecondaryResourcesOpts = { canPaginate: boolean, force: boolean, page: any[], pagResult: StorePaginationResult }
/**
 * Function to fetch resources that are required to supplement information needed by a single page in a PaginatedResourceTable
 */
export type PagTableFetchPageSecondaryResources = (opts: PagTableFetchPageSecondaryResourcesOpts) => Promise<any>
