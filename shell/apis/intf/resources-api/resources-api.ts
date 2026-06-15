import {
  ResourceType, FindMethodOptions, FindAllMethodOptions, FindFilteredPageOptions, FindFilteredLabelSelectorOptions,
  FindFilteredPageResponse, FindFilteredLabelSelectorResponse
} from './resource-base';
import { SteveListResponse, SteveGetResponse } from '@shell/types/rancher/steve.api';

/**
 * Base interface for all resource API operations.
 *
 * Provides type-safe methods for interacting with Kubernetes and Rancher resources.
 * Used by both cluster-scoped and management-scoped APIs, and can be extended
 * by custom store implementations (e.g. Harvester, Epinio).
 *
 * @example
 * ```ts
 * import { useResources, K8S } from '@shell/apis';
 *
 * const resources = useResources();
 *
 * const deployment = await resources.cluster.find(K8S.DEPLOYMENT, 'default/my-app');
 * ```
 */
export interface ResourcesApi {
  /**
   * Finds a specific resource by its type and ID.
   *
   * @template T - The type of the resource (defaults to SteveGetResponse)
   * @param resourceType - The type of the resource to find (use **{@link K8S}** constant). See also {@link ResourceType}.
   * @param resourceId - The unique identifier of the resource to find. If the resource is namespaced, this should be in the format `namespace/name`.
   * @param options - Optional find arguments
   * @returns The found resource item or null if not found.
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   *
   * // Namespaced resource - ID must be in "namespace/name" format
   * const pod = await resources.cluster.find(K8S.POD, 'default/my-pod-123');
   *
   * // Cluster-scoped resource - ID is just the name
   * const node = await resources.cluster.find(K8S.NODE, 'worker-1');
   * ```
   */
  find<T = SteveGetResponse>(
    resourceType: ResourceType,
    resourceId: string,
    options?: FindMethodOptions
  ): Promise<T | null>;

  /**
   * Finds resources using pagination mode with server-side filtering, sorting, and pagination.
   *
   * Requires `ui-sql-cache` to be enabled.
   *
   * @template T - The type of the resources (defaults to SteveListResponse)
   * @param resourceType - The type of the resources to find (use **{@link K8S}** constant). See also {@link ResourceType}.
   * @param options - Pagination options with server-side filtering and sorting via the Steve API's pagination cache. See {@link FindFilteredPageOptions}.
   * @returns Response containing resource items (may be transient if requested, otherwise cached array).
   * @throws Error if pagination mode is requested but `ui-sql-cache` is not enabled.
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
   *     filters: [],
   *     sort: []
   *   }
   * });
   * ```
   */
  findFiltered<T = SteveListResponse>(
    resourceType: ResourceType,
    options: FindFilteredPageOptions
  ): Promise<FindFilteredPageResponse<T>>;

  /**
   * Finds resources using label selector matching.
   *
   * Filters resources by Kubernetes labels. The store automatically handles pagination:
   * - If `ui-sql-cache` is enabled: uses server-side pagination
   * - Otherwise: uses native Kubernetes API pagination
   *
   * @template T - The type of the resources (defaults to SteveListResponse)
   * @param resourceType - The type of the resources to find (use **{@link K8S}** constant). See also {@link ResourceType}.
   * @param options - Label selector options for filtering. See {@link FindFilteredLabelSelectorOptions}.
   * @returns Response containing resource items (may be transient if requested, otherwise cached array).
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
  findFiltered<T = SteveListResponse>(
    resourceType: ResourceType,
    options: FindFilteredLabelSelectorOptions
  ): Promise<FindFilteredLabelSelectorResponse<T>>;

  /**
   * @internal Implementation - use one of the overloads above
   */
  findFiltered<T = SteveListResponse>(
    resourceType: ResourceType,
    options: FindFilteredPageOptions | FindFilteredLabelSelectorOptions
  ): Promise<FindFilteredPageResponse<T> | FindFilteredLabelSelectorResponse<T>>;

  /**
   * Fetches all resources of a specific type with advanced options.
   * This method provides additional capabilities like incremental loading and namespace filtering.
   *
   * @template T - The type of the resources (defaults to SteveListResponse)
   * @param resourceType - The type of the resources to find (use **{@link K8S}** constant). See also {@link ResourceType}.
   * @param options - Optional advanced fetch options (incremental loading, namespace filtering, etc.)
   * @returns An array of resource items or an empty array if none are found.
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   * const allPods = await resources.cluster.findAll(K8S.POD, {
   *   namespaced: ['default', 'kube-system']
   * });
   * ```
   */
  findAll<T = SteveListResponse>(
    resourceType: ResourceType,
    options?: FindAllMethodOptions
  ): Promise<T[]>;
}
