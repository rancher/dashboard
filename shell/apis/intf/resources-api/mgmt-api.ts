import { ActionFindPageTransientResponse } from '@shell/types/store/dashboard-store.types';
import {
  ResourceType, CreateResourceData, FindMethodOptions, FindAllMethodOptions, FindFilteredPageOptions, FindFilteredLabelSelectorOptions,
  FindFilteredLabelSelectorResponse, SteveResource,
  FindFilteredPageOptionsTransient,
} from './resource-base';
import { ResourceInstance } from './resource-instance';
import { ResourcesApi } from './resources-api';

/**
 * Provides access to the Management layer in Rancher UI (users, global settings, etc.)
 *
 * Requests are scoped to Rancher's global resources, not to the cluster currently being viewed.
 * For Kubernetes resources in a cluster (Pods, Deployments, ConfigMaps, etc.) use the Cluster
 * API instead - see {@link ClusterApi}.
 *
 * Most management resources are cluster-scoped, so their ID is just the name. Projects and
 * their bindings are namespaced by the ID of the cluster they belong to, so those take the
 * `clusterId/name` format.
 *
 * @example
 * ```ts
 * import { useResources, K8S } from '@shell/apis';
 *
 * const resources = useResources();
 *
 * const user = await resources.mgmt.find(K8S.USER, 'u-xyz789');
 * ```
 */
export interface MgmtApi extends ResourcesApi {
  /**
   * Finds a specific resource by its type and ID.
   *
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @template I - An override for the response type. By default this uses T and supplements the response, or by supplying a value ignores T
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
   * // Cluster-scoped resource - ID is just the name
   * const user = await resources.mgmt.find(K8S.USER, 'u-xyz789');
   *
   * // Namespaced resource - Projects are namespaced by their cluster ID
   * const project = await resources.mgmt.find(K8S.PROJECT, 'c-m-abcde12345/p-xyz789');
   * ```
   */
  find<T = Record<string, any>, I = ResourceInstance<T>>(
    resourceType: ResourceType,
    resourceId: string,
    options?: FindMethodOptions
  ): Promise<I | null>;

  /**
   * Finds resources using pagination mode with server-side filtering, sorting, and pagination.
   *
   * The response is not cached
   *
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @template I - An override for the response type. By default this uses T and supplements the response, or by supplying a value ignores T
   * @param resourceType - The type of the resources to find (examples in **{@link K8S}**). See also {@link ResourceType}.
   * @param options - Pagination options with server-side filtering and sorting via the Steve API's pagination cache. See {@link FindFilteredPageOptions}.
   * @returns Response containing resource items
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   *
   * const users = await resources.mgmt.findFiltered(K8S.USER, {
   *   transient: true,
   *   pagination: {
   *     page: 1,
   *     pageSize: 10,
   *     filters: [],
   *     sort: []
   *   }
   * });
   * ```
   */
  findFiltered<T = Record<string, any>, I = ActionFindPageTransientResponse<ResourceInstance<T>>>(
    resourceType: ResourceType,
    options: FindFilteredPageOptionsTransient
  ): Promise<I>;

  /**
   * Finds resources using pagination mode with server-side filtering, sorting, and pagination.
   *
   * The response is cached.
   *
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @template I - An override for the response type. By default this uses T and supplements the response, or by supplying a value ignores T
   * @param resourceType - The type of the resources to find (examples in **{@link K8S}**). See also {@link ResourceType}.
   * @param options - Pagination options with server-side filtering and sorting via the Steve API's pagination cache. See {@link FindFilteredPageOptions}.
   * @returns Response containing resource items
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   *
   * const users = await resources.mgmt.findFiltered(K8S.USER, {
   *   pagination: {
   *     page: 1,
   *     pageSize: 10,
   *     filters: [],
   *     sort: []
   *   }
   * });
   * ```
   */
  findFiltered<T = Record<string, any>, I = ResourceInstance<T>>(
    resourceType: ResourceType,
    options: FindFilteredPageOptions
  ): Promise<I[]>;

  /**
   * Finds resources using label selector matching.
   *
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @template I - An override for the response type. By default this uses T and supplements the response, or by supplying a value ignores T
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
   * const users = await resources.mgmt.findFiltered(K8S.USER, {
   *   labelSelector: { matchLabels: { 'authz.management.cattle.io/bootstrapping': 'admin-user' } }
   * });
   * ```
   */
  findFiltered<T = Record<string, any>, I = FindFilteredLabelSelectorResponse<ResourceInstance<T>>>(
    resourceType: ResourceType,
    options: FindFilteredLabelSelectorOptions
  ): Promise<I>;

  /**
   * @internal Implementation - use one of the overloads above
   */
  findFiltered<T = Record<string, any>, I = ResourceInstance<T>>(
    resourceType: ResourceType,
    options: FindFilteredPageOptions | FindFilteredPageOptionsTransient | FindFilteredLabelSelectorOptions
  ): Promise<I[] | ResourceInstance<T>[] | ActionFindPageTransientResponse<ResourceInstance<T>>>;

  /**
   * Fetches all resources of a specific type with advanced options.
   * This method provides additional capabilities like incremental loading and namespace filtering.
   *
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @template I - An override for the response type. By default this uses T and supplements the response, or by supplying a value ignores T
   * @param resourceType - The type of the resources to find (examples in **{@link K8S}**). See also {@link ResourceType}.
   * @param options - Optional advanced fetch options (incremental loading, namespace filtering, etc.)
   * @returns An array of resource items or an empty array if none are found.
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   * const allUsers = await resources.mgmt.findAll(K8S.USER);
   * ```
   */
  findAll<T = Record<string, any>, I = ResourceInstance<T>>(
    resourceType: ResourceType,
    options?: FindAllMethodOptions
  ): Promise<I[]>;

  /**
   * Creates a new resource.
   *
   * The `data` object must include a `type` property identifying the resource type.
   * This is a raw HTTP operation — it does not check permissions or update the store cache.
   *
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @template I - An override for the response type. By default this uses T and supplements the response, or by supplying a value ignores T
   * @param data - The resource data to create. Must include a `type` property (examples in **{@link K8S}**). See also {@link CreateResourceData}.
   * @returns The created resource instance.
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   *
   * const globalRoleBinding = await resources.mgmt.create({
   *   type:           K8S.GLOBAL_ROLE_BINDING,
   *   metadata:       { name: 'grb-my-binding' },
   *   userName:       'u-xyz789',
   *   globalRoleName: 'user-base'
   * });
   * ```
   */
  create<T = Record<string, any>, I = SteveResource<T>>(
    data: CreateResourceData
  ): Promise<I>;

  /**
   * Applies a partial update to a resource using HTTP PATCH.
   *
   * Only the fields provided in `data` are sent to the server.
   * This is a raw HTTP operation — it does not check permissions or update the store cache.
   *
   * The patch media type is taken from the resource's OpenAPI definition. Management resources
   * are CRDs, so these requests are sent as merge patch - list fields are replaced rather than
   * merged by key.
   *
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @template I - An override for the response type. By default this uses T and supplements the response, or by supplying a value ignores T
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
   * const result = await resources.mgmt.update(K8S.USER, 'u-xyz789', {
   *   description: 'Updated description'
   * });
   * ```
   */
  update<T = Record<string, any>, I = SteveResource<T>>(
    resourceType: ResourceType,
    resourceId: string,
    data: Record<string, any>
  ): Promise<I>;

  /**
   * Performs a full replacement update of a resource using HTTP PUT.
   *
   * Runs `cleanForSave` on the data before sending.
   * This is a raw HTTP operation — it does not check permissions or update the store cache.
   *
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @template I - An override for the response type. By default this uses T and supplements the response, or by supplying a value ignores T
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
   * const userData = await resources.mgmt.find(K8S.USER, 'u-xyz789');
   * userData.description = 'Updated description';
   *
   * const result = await resources.mgmt.replace(K8S.USER, 'u-xyz789', userData);
   * ```
   */
  replace<T = Record<string, any>, I = SteveResource<T>>(
    resourceType: ResourceType,
    resourceId: string,
    data: Record<string, any>
  ): Promise<I>;

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
   * await resources.mgmt.delete(K8S.GLOBAL_ROLE_BINDING, 'grb-my-binding');
   * ```
   */
  delete(
    resourceType: ResourceType,
    resourceId: string
  ): Promise<void>;
}
