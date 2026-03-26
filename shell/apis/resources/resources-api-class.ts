import { ResourceType } from '@shell/apis/intf/resources-api/resource-base';
import { ClusterApi } from '@shell/apis/intf/resources-api/cluster-api';
import { MgmtApi } from '@shell/apis/intf/resources-api/mgmt-api';
import { SteveListResponse, SteveGetResponse } from '@shell/types/rancher/steve.api';
import { GetMethodOptions, ListAllMethodOptions, ListMethodOptions, LabelSelectorMethodOptions } from '@shell/types/store/dashboard-store.types';
import { Store } from 'vuex';

export class ResourcesApiClassImpl implements ClusterApi, MgmtApi {
  private store: Store<any>;

  private storeType: 'cluster' | 'management';

  private surfaceError(message: string): never {
    console.error(`Resource API error - ${ this.storeType } - ${ message }`); // eslint-disable-line no-console
    throw new Error(`Resource API error - ${ this.storeType } - ${ message }`);
  }

  constructor(store: Store<any>, storeType: 'cluster' | 'management') {
    this.store = store;
    this.storeType = storeType;
  }

  /**
   * Finds a specific resource by its type and ID.
   *
   * @template T - The type of the resource (defaults to SteveGetResponse)
   * @param resourceType - The type of the resource to find (use **{@link K8S}** contant). See also {@link ResourceType}.
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
  async get<T = SteveGetResponse>(
    resourceType: ResourceType,
    resourceId: string,
    options?: GetMethodOptions
  ): Promise<T | null> {
    try {
      const resource = await this.store.dispatch(`${ this.storeType }/find`, {
        type: resourceType,
        id:   resourceId,
        opt:  options || {}
      });

      return resource as T;
    } catch (e: unknown) {
      this.surfaceError(`Failed to get resource ${ resourceType }/${ resourceId }: ${ (e as Error).message }`);
    }
  }

  /**
   * Lists all resources of a specific type.
   *
   * @template T - The type of the resources (defaults to SteveListResponse)
   * @param resourceType - The type of the resources to list (use **{@link K8S}** contant). See also {@link ResourceType}.
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
  async list<T = SteveListResponse>(
    resourceType: ResourceType,
    options?: ListMethodOptions
  ): Promise<T[]> {
    try {
      const resources = await this.store.dispatch(`${ this.storeType }/findPage`, {
        type: resourceType,
        opt:  options || {}
      });

      return resources as T[];
    } catch (e: unknown) {
      this.surfaceError(`Failed to list resources ${ resourceType }: ${ (e as Error).message }`);
    }
  }

  /**
   * Fetches all resources of a specific type with advanced options.
   * This method provides additional capabilities like incremental loading, depagination, and namespace filtering.
   *
   * @template T - The type of the resources (defaults to SteveListResponse)
   * @param resourceType - The type of the resources to list (use **{@link K8S}** contant). See also {@link ResourceType}.
   * @param options - Optional advanced fetch options (incremental loading, depagination, namespace filtering, etc.)
   * @returns An array of resource items or an empty array if none are found.
   *
   * @example
   * ```ts
   * import { K8S } from '@shell/apis';
   * import type { Pod } from '@shell/types/resources';
   *
   * // Fetch all pods with incremental loading
   * const pods = await resources.cluster.listAll<Pod>(K8S.POD, {
   *   incremental: {
   *     quickLoadCount: 10,
   *     resourcesPerIncrement: 50,
   *     increments: 5,
   *     pageByNumber: false
   *   }
   * });
   *
   * // Fetch all resources across all pages
   * const allPods = await resources.cluster.listAll<Pod>(K8S.POD, {
   *   depaginate: true
   * });
   *
   * // Fetch resources in specific namespaces
   * const namespacedPods = await resources.cluster.listAll<Pod>(K8S.POD, {
   *   namespaced: ['default', 'kube-system']
   * });
   * ```
   */
  async listAll<T = SteveListResponse>(
    resourceType: ResourceType,
    options?: ListAllMethodOptions
  ): Promise<T[]> {
    try {
      const resources = await this.store.dispatch(`${ this.storeType }/findAll`, {
        type: resourceType,
        opt:  options || {}
      });

      return resources as T[];
    } catch (e: unknown) {
      this.surfaceError(`Failed to list all resources ${ resourceType }: ${ (e as Error).message }`);
    }
  }

  /**
   * Finds resources based on a label selector string.
   *
   * @template T - The type of the resources (defaults to SteveListResponse)
   * @param resourceType - The type of the resources to filter (use **{@link K8S}** contant). See also {@link ResourceType}.
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
  async labelSelector<T = SteveListResponse>(
    resourceType: ResourceType,
    selector: string,
    options?: LabelSelectorMethodOptions
  ): Promise<T[]> {
    try {
      const resources = await this.store.dispatch(`${ this.storeType }/findLabelSelector`, {
        type: resourceType,
        selector,
        opt:  options || {}
      });

      return resources as T[];
    } catch (e: unknown) {
      this.surfaceError(`Failed to find resources with selector ${ selector }: ${ (e as Error).message }`);
    }
  }
}
