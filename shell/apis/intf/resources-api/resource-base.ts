import { K8SResourceType } from './resource-constants';
import {
  ActionFindAllArgs, ActionFindArgs,
  ActionFindMatchingArgs,
  ActionFindPageArgs,
  ActionFindPageResponse, ActionFindMatchingResponse
} from '@shell/types/store/dashboard-store.types';

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
 * Options for `findFiltered` when using label selector matching (label selector mode).
 *
 * Filters resources by `labelSelector` (matchLabels / matchExpressions).
 * The store automatically handles pagination:
 * - If `ui-sql-cache` is enabled: uses server-side pagination
 * - Otherwise: uses native Kubernetes API pagination
 *
 * @example
 * ```ts
 * import { useResources, K8S } from '@shell/apis';
 *
 * const resources = useResources();
 *
 * const pods = await resources.cluster.findFiltered(K8S.POD, {
 *   labelSelector: { matchLabels: { type: 'my-type' } }
 * });
 * ```
 */
export type FindFilteredLabelSelectorOptions = Omit<ActionFindMatchingArgs, 'depaginate'>;

/**
 * @interface
 * Options for `findFiltered` when using server-side pagination (pagination mode).
 *
 * Requires `pagination` settings for server-side filtering, sorting, and pagination
 * via the Steve API's pagination cache. **Only available when `ui-sql-cache` is enabled.**
 *
 * @example
 * ```ts
 * import { useResources, K8S } from '@shell/apis';
 *
 * const resources = useResources();
 *
 * const pods = await resources.cluster.findFiltered(K8S.POD, {
 *   pagination: {
 *     page: 1,
 *     pageSize: 10,
 *     projectsOrNamespaces: [],
 *     filters: [],
 *     sort: []
 *   }
 * });
 * ```
 *
 * See {@link ActionFindPageArgs} for complete pagination options.
 */

// @internal We use an interface instead of a type alias so the documentation generator
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FindFilteredPageOptions extends ActionFindPageArgs {}

/**
 * @interface
 * Response type for `findFiltered` when using pagination mode.
 *
 * Aligns with the response type of the underlying `findPage` store action.
 * Can be either a transient response object (with data and pagination) or an array of resources.
 */
export type FindFilteredPageResponse<T = any> = ActionFindPageResponse<T>;

/**
 * @interface
 * Response type for `findFiltered` when using label selector mode.
 *
 * Aligns with the response type of the underlying `findMatching` store action via `findLabelSelector`.
 * Can be either a transient response object (with data and pagination) or an array of resources.
 */
export type FindFilteredLabelSelectorResponse<T = any> = ActionFindMatchingResponse<T>;
