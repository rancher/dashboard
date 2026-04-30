import { K8SResourceType } from './resource-constants';
import {
  ActionFindAllArgs, ActionFindArgs,
  ActionFindMatchingArgs
} from '@shell/types/store/dashboard-store.types';
import { PaginationSort, PaginationParamFilter, PaginationParamProjectOrNamespace } from '@shell/types/store/pagination.types';
import { KubeLabelSelector } from '@shell/types/kube/kube-api';

/**
 * @interface
 * The type of the resource - can be a **string** (for CRDs) or a constant from **{@link K8S}**
 *
 * @example
 * ```ts
 * import { K8S } from '@shell/apis';
 *
 * // Using constants (recommended)
 * resources.cluster.findAll(K8S.POD);
 *
 * // Using strings (for CRDs or dynamic resources)
 * resources.cluster.findAll('mycompany.io.customresource');
 * ```
 */
export type ResourceType = K8SResourceType | string;

/**
 * @interface
 * Resources API "findAll" options
 */
export type FindAllMethodOptions = Omit<ActionFindAllArgs, 'hasManualRefresh' | 'depaginate' | 'saveCountAs' | 'incremental'>;

/**
 * @interface
 * Resources API "find" options
 */
export type FindMethodOptions = Omit<ActionFindArgs, 'invalidatePageCache' | 'method' | 'headers'>;

/**
 * @interface
 * Options for `findFiltered` when using label selector matching.
 *
 * Requires `labelSelector` to filter resources by labels.
 * The store decides whether to use paginated or non-paginated matching
 * depending on whether server-side pagination is enabled.
 */
export type FindFilteredLabelSelectorOptions = Omit<ActionFindMatchingArgs, 'depaginate'>;

/**
 * @interface
 * Options for `findFiltered` when using label selector matching with server-side pagination.
 *
 * Requires both `labelSelector` and `pagination` settings.
 * Extends {@link FindFilteredLabelSelectorOptions} with pagination support for
 * server-side filtering, sorting, and pagination via the Steve API's pagination cache.
 *
 * @example
 * ```ts
 * import { useResources, K8S } from '@shell/apis';
 * import { PaginationParamFilter, PaginationFilterField } from '@shell/types/store/pagination.types';
 *
 * const resources = useResources();
 * const pods = await resources.cluster.findFiltered(K8S.POD, {
 *   labelSelector: { matchLabels: { app: 'nginx' } },
 *   pagination: {
 *     page:     1,
 *     pageSize: 25,
 *     sort:     [{ field: 'metadata.name', asc: true }],
 *     filters:  [PaginationParamFilter.createSingleField({ field: 'metadata.namespace', value: 'default' })],
 *   }
 * });
 * ```
 */
export type FindFilteredPageOptions = FindFilteredLabelSelectorOptions & {
  /**
   * Pagination settings for server-side pagination via the Steve API's cache.
   */
  pagination: {
    /**
     * Page number to fetch (starts at 1)
     */
    page?: number | null;
    /**
     * Number of results per page (defaults to 10)
     */
    pageSize?: number | null;
    /**
     * Sort the results by one or more fields.
     *
     * See {@link PaginationSort}
     */
    sort?: PaginationSort[];
    /**
     * A collection of `filter` params for server-side filtering (e.g. `metadata.name=my-pod`).
     *
     * See {@link PaginationParamFilter}
     */
    filters?: PaginationParamFilter | PaginationParamFilter[];
    /**
     * A collection of `projectsornamespace` params to filter by project or namespace.
     *
     * See {@link PaginationParamProjectOrNamespace}
     */
    projectsOrNamespaces?: PaginationParamProjectOrNamespace | PaginationParamProjectOrNamespace[];
    /**
     * Traditional Kube labelSelector consisting of matchLabels and matchExpressions.
     *
     * See {@link KubeLabelSelector}
     */
    labelSelector?: KubeLabelSelector;
  };
};
