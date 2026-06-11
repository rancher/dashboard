import { ActionFindPageTransientResponse } from '@shell/types/store/dashboard-store.types';
import {
  ResourceType, CreateResourceData, FindMethodOptions, FindAllMethodOptions, FindFilteredPageOptions, FindFilteredLabelSelectorOptions,
  FindFilteredLabelSelectorResponse, SteveResource,
  FindFilteredPageOptionsTransient,
} from './resource-base';
import { ResourceInstance } from './resource-instance';

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
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @param resourceType - The type of the resource to find (examples in **{@link K8S}**). See also {@link ResourceType}.
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
  find<T = Record<string, any>>(
    resourceType: ResourceType,
    resourceId: string,
    options?: FindMethodOptions
  ): Promise<ResourceInstance<T>>;

  /**
   * Finds resources using pagination mode with server-side filtering, sorting, and pagination.
   *
   * The response is not cached
   *
   * Requires `ui-sql-cache` to be enabled.
   *
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @param resourceType - The type of the resources to find (examples in **{@link K8S}**). See also {@link ResourceType}.
   * @param options - Pagination options with server-side filtering and sorting via the Steve API's pagination cache. See {@link FindFilteredPageOptions}.
   * @returns Response containing resource items
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
  findFiltered<T = Record<string, any>>(
    resourceType: ResourceType,
    options: FindFilteredPageOptionsTransient
  ): Promise<ActionFindPageTransientResponse<ResourceInstance<T>>>;

  /**
   * Finds resources using pagination mode with server-side filtering, sorting, and pagination.
   *
   * The response is cached.
   *
   * Requires `ui-sql-cache` to be enabled.
   *
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @param resourceType - The type of the resources to find (examples in **{@link K8S}**). See also {@link ResourceType}.
   * @param options - Pagination options with server-side filtering and sorting via the Steve API's pagination cache. See {@link FindFilteredPageOptions}.
   * @returns Response containing resource items
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
  findFiltered<T = Record<string, any>>(
    resourceType: ResourceType,
    options: FindFilteredPageOptions
  ): Promise<ResourceInstance<T>[]>;

  /**
   * Finds resources using label selector matching.
   *
   * Filters resources by Kubernetes labels. The store automatically handles pagination:
   * - If `ui-sql-cache` is enabled: uses server-side pagination
   * - Otherwise: uses native Kubernetes API pagination
   *
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @param resourceType - The type of the resources to find (examples in **{@link K8S}**). See also {@link ResourceType}.
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
  findFiltered<T = Record<string, any>>(
    resourceType: ResourceType,
    options: FindFilteredLabelSelectorOptions
  ): Promise<FindFilteredLabelSelectorResponse<ResourceInstance<T>>>;

  /**
   * @internal Implementation - use one of the overloads above
   */
  findFiltered<T = Record<string, any>>(
    resourceType: ResourceType,
    options: FindFilteredPageOptions | FindFilteredPageOptionsTransient | FindFilteredLabelSelectorOptions
  ): Promise<ResourceInstance<T>[] | ActionFindPageTransientResponse<ResourceInstance<T>>>;

  /**
   * Fetches all resources of a specific type with advanced options.
   * This method provides additional capabilities like incremental loading and namespace filtering.
   *
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @param resourceType - The type of the resources to find (examples in **{@link K8S}**). See also {@link ResourceType}.
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
  findAll<T = Record<string, any>>(
    resourceType: ResourceType,
    options?: FindAllMethodOptions
  ): Promise<ResourceInstance<T>[]>;

  /**
   * Creates a new resource.
   *
   * The `data` object must include a `type` property identifying the resource type.
   * This is a raw HTTP operation — it does not check permissions or update the store cache.
   *
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @param data - The resource data to create. Must include a `type` property (examples in **{@link K8S}**). See also {@link CreateResourceData}.
   * @returns The created resource instance.
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   *
   * const configMap = await resources.cluster.create({
   *   type:     K8S.CONFIG_MAP,
   *   metadata: { name: 'my-config', namespace: 'default' },
   *   data:     { key: 'value' }
   * });
   * ```
   */
  create<T = Record<string, any>>(
    data: CreateResourceData
  ): Promise<SteveResource<T>>;

  /**
   * Applies a partial update to a resource using HTTP PATCH (merge-patch).
   *
   * Only the fields provided in `data` are sent to the server.
   * This is a raw HTTP operation — it does not check permissions or update the store cache.
   *
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @param resourceType - The type of the resource (examples in **{@link K8S}**). See also {@link ResourceType}.
   * @param resourceId - The unique identifier. If namespaced, use `namespace/name` format.
   * @param data - An object containing only the fields to update.
   * @returns The server response.
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   *
   * const result = await resources.cluster.update(K8S.CONFIG_MAP, 'default/my-config', {
   *   someField: { newKey: 'newValue' }
   * });
   * ```
   */
  update<T = Record<string, any>>(
    resourceType: ResourceType,
    resourceId: string,
    data: Record<string, any>
  ): Promise<SteveResource<T>>;

  /**
   * Performs a full replacement update of a resource using HTTP PUT.
   *
   * Runs `cleanForSave` on the data before sending.
   * This is a raw HTTP operation — it does not check permissions or update the store cache.
   *
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @param resourceType - The type of the resource (examples in **{@link K8S}**). See also {@link ResourceType}.
   * @param resourceId - The unique identifier. If namespaced, use `namespace/name` format.
   * @param data - The complete resource data to send as the replacement.
   * @returns The server response.
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   * const configMapData = await resources.cluster.find(K8S.CONFIG_MAP, 'default/my-config');
   * configMapData.someField = { newKey: 'newValue' };
   *
   * const result = await resources.cluster.replace(K8S.CONFIG_MAP, 'default/my-config', configMapData);
   * ```
   */
  replace<T = Record<string, any>>(
    resourceType: ResourceType,
    resourceId: string,
    data: Record<string, any>
  ): Promise<SteveResource<T>>;

  /**
   * Deletes a resource by type and ID using HTTP DELETE.
   *
   * This is a raw HTTP operation — it does not check permissions or update the store cache.
   *
   * @param resourceType - The type of the resource (examples in **{@link K8S}**). See also {@link ResourceType}.
   * @param resourceId - The unique identifier. If namespaced, use `namespace/name` format.
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   *
   * await resources.cluster.delete(K8S.CONFIG_MAP, 'default/my-config');
   * ```
   */
  delete(
    resourceType: ResourceType,
    resourceId: string
  ): Promise<void>;
}
