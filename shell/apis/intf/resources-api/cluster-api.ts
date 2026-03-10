import { ResourceType, ResourceBase } from './resource-base';
import { ActionFindPageArgs, ActionFindLabelSelectorArgs, ActionFindArgs } from '@shell/store/dashboard-store.types';

/**
 * Provides access to the Cluster API which can be used for managing cluster resources in Rancher UI
 *
 * @example
 * ```ts
 * import { K8S } from '@shell/apis';
 * import type { Pod, Deployment } from '@shell/types/resources';
 *
 * // Type-safe with generics
 * const pods = await resources.cluster.list<Pod>(K8S.POD);
 * pods[0].metadata.name; // ✅ typed!
 *
 * const deployment = await resources.cluster.get<Deployment>(K8S.DEPLOYMENT, 'my-app');
 * deployment.spec.replicas; // ✅ typed!
 * ```
 */
export interface ClusterApi {
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
   * import type { Pod } from '@shell/types/resources';
   *
   * const pod = await resources.cluster.get<Pod>(K8S.POD, 'my-pod-123');
   * console.log(pod.spec.containers);
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
   * import type { Deployment } from '@shell/types/resources';
   *
   * const deployments = await resources.cluster.list<Deployment>(K8S.DEPLOYMENT);
   * deployments.forEach(d => console.log(d.spec.replicas));
   * ```
   */
  list<T extends ResourceBase = ResourceBase>(
    resourceType: ResourceType,
    options?: ActionFindPageArgs
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
   * import type { Pod } from '@shell/types/resources';
   *
   * const pods = await resources.cluster.labelSelector<Pod>('app=nginx,env=production');
   * pods.forEach(p => console.log(p.metadata.name));
   * ```
   */
  labelSelector<T extends ResourceBase = ResourceBase>(
    selector: string,
    options?: ActionFindLabelSelectorArgs
  ): Promise<T[]>;
}
