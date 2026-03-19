import type {
  PaginationParamFilter,
  PaginationParamProjectOrNamespace,
  PaginationSort,
} from '@shell/types/store/pagination.types';
import type { KubeLabelSelector } from '@shell/types/kube/kube-api';

/**
 * Filter configuration for a PaginatedResourceArray.
 *
 * Mirrors the filter-related subset of PaginationArgs so callers
 * can update filters without rebuilding the full request options.
 */
export interface PaginationFilter {
  filters?: PaginationParamFilter[];
  projectsOrNamespaces?: PaginationParamProjectOrNamespace[];
  labelSelector?: KubeLabelSelector;
  sort?: PaginationSort[];
}

/**
 * Options passed when creating a PaginatedResourceArray via fetchResource.
 */
export interface FetchResourceOptions {
  pagination?: PaginationFilter;

  /**
   * Number of results per page. Defaults to the store/product default.
   */
  pageSize?: number;

  /**
   * The single namespace to scope the request to (URL path, not a filter param).
   */
  namespace?: string;

  /**
   * Watch the resource for live updates via websocket.
   */
  watch?: boolean;

  /**
   * If true the response is not persisted in the store.
   */
  transient?: boolean;
}
