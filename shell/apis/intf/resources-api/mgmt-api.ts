import { ResourceType, ResourceBase } from './resource-base';
import { ActionFindPageArgs, ActionFindLabelSelectorArgs, ActionFindArgs, ActionFindAllArgs } from '@shell/types/store/dashboard-store.types';

/**
 * Provides access to the Management layer in Rancher UI (users, global settings, etc.)
 *
 * @example
 * ```ts
 * import { K8S } from '@shell/apis';
 * import type { User, Cluster } from '@shell/types/resources';
 *
 * // Type-safe with generics
 * const users = await resources.mgmt.list<User>(K8S.USER);
 * users[0].username; // ✅ typed!
 *
 * const cluster = await resources.mgmt.get<Cluster>(K8S.CLUSTER, 'c-abc123');
 * cluster.spec.displayName; // ✅ typed!
 * ```
 */
export interface MgmtApi {
  /**
   * Finds a specific resource by its type and ID.
   *
   * @template T - The type of the resource (defaults to ResourceBase)
   * @param resourceType - The type of the resource to find (use K8S constants).
   * @param resourceId - The unique identifier of the resource to find.
   * @param options - Optional find arguments
   * @returns The found resource item or null if not found.
   *
   * @example
   * ```ts
   * import { K8S } from '@shell/apis';
   * import type { User } from '@shell/types/resources';
   *
   * const user = await resources.mgmt.get<User>(K8S.USER, 'u-xyz789');
   * console.log(user.username);
   * ```
   */
  get<T extends ResourceBase = ResourceBase>(
    resourceType: ResourceType,
    resourceId: string,
    options?: ActionFindArgs
  ): Promise<T | null>;

  /**
   * Lists all resources of a specific type.
   *
   * @template T - The type of the resources (defaults to ResourceBase)
   * @param resourceType - The type of the resources to list (use K8S constants).
   * @param options - Optional pagination and filter options
   * @returns An array of resource items or an empty array if none are found.
   *
   * @example
   * ```ts
   * import { K8S } from '@shell/apis';
   * import type { Cluster } from '@shell/types/resources';
   *
   * const clusters = await resources.mgmt.list<Cluster>(K8S.CLUSTER);
   * clusters.forEach(c => console.log(c.spec.displayName));
   * ```
   */
  list<T extends ResourceBase = ResourceBase>(
    resourceType: ResourceType,
    options?: ActionFindPageArgs
  ): Promise<T[]>;

  /**
   * Fetches all resources of a specific type with advanced options.
   * This method provides additional capabilities like incremental loading, depagination, and namespace filtering.
   *
   * @template T - The type of the resources (defaults to ResourceBase)
   * @param resourceType - The type of the resources to list (use K8S constants).
   * @param options - Optional advanced fetch options (incremental loading, depagination, namespace filtering, etc.)
   * @returns An array of resource items or an empty array if none are found.
   *
   * @example
   * ```ts
   * import { K8S } from '@shell/apis';
   * import type { User } from '@shell/types/resources';
   *
   * // Fetch all users with incremental loading
   * const users = await resources.mgmt.listAll<User>(K8S.USER, {
   *   incremental: {
   *     quickLoadCount: 10,
   *     resourcesPerIncrement: 50,
   *     increments: 5,
   *     pageByNumber: false
   *   }
   * });
   *
   * // Fetch all resources across all pages
   * const allUsers = await resources.mgmt.listAll<User>(K8S.USER, {
   *   depaginate: true
   * });
   * ```
   */
  listAll<T extends ResourceBase = ResourceBase>(
    resourceType: ResourceType,
    options?: ActionFindAllArgs
  ): Promise<T[]>;

  /**
   * Finds resources based on a label selector string.
   *
   * @template T - The type of the resources (defaults to ResourceBase)
   * @param selector - The label selector string to filter resources (e.g., "app=nginx,env=prod").
   * @param options - Optional find arguments
   * @returns An array of resource items that match the label selector or an empty array if none are found.
   *
   * @example
   * ```ts
   * import { K8S } from '@shell/apis';
   * import type { User } from '@shell/types/resources';
   *
   * const adminUsers = await resources.mgmt.labelSelector<User>('role=admin');
   * adminUsers.forEach(u => console.log(u.username));
   * ```
   */
  labelSelector<T extends ResourceBase = ResourceBase>(
    selector: string,
    options?: ActionFindLabelSelectorArgs
  ): Promise<T[]>;
}
