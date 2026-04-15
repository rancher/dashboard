import { ResourceType, FindMethodOptions, FindAllMethodOptions, FindFilteredMethodOptions } from './resource-base';
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
 * const pods = await resources.cluster.findFiltered(K8S.POD);
 * const deployment = await resources.cluster.find(K8S.DEPLOYMENT, 'my-app');
 * ```
 */
export interface ResourcesApi {
  /**
   * Finds a specific resource by its type and ID.
   *
   * @template T - The type of the resource (defaults to SteveGetResponse)
   * @param resourceType - The type of the resource to find (use **{@link K8S}** constant). See also {@link ResourceType}.
   * @param resourceId - The unique identifier of the resource to find.
   * @param options - Optional find arguments
   * @returns The found resource item or null if not found.
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   * const pod = await resources.cluster.find(K8S.POD, 'my-pod-123');
   * ```
   */
  find<T = SteveGetResponse>(
    resourceType: ResourceType,
    resourceId: string,
    options?: FindMethodOptions
  ): Promise<T | null>;

  /**
   * Finds resources of a specific type with filtering, pagination, and label selector support.
   *
   * This method covers two use cases:
   * - **Paginated listing** — pass options with pagination settings
   * - **Label selector matching** — pass a selector string to filter by labels
   *
   * @template T - The type of the resources (defaults to SteveListResponse)
   * @param resourceType - The type of the resources to find (use **{@link K8S}** constant). See also {@link ResourceType}.
   * @param options - Optional pagination and filter options
   * @returns An array of resource items or an empty array if none are found.
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   *
   * // Paginated listing
   * const deployments = await resources.cluster.findFiltered(K8S.DEPLOYMENT);
   *
   * // With label selector
   * const pods = await resources.cluster.findFiltered(K8S.POD, { selector: 'app=nginx,env=prod' });
   * ```
   */
  findFiltered<T = SteveListResponse>(
    resourceType: ResourceType,
    options?: FindFilteredMethodOptions
  ): Promise<T[]>;

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
