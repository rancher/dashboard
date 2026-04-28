import { ResourceType, FindMethodOptions, FindAllMethodOptions, FindFilteredMethodOptions } from '@shell/apis/intf/resources-api/resource-base';
import { ResourcesApi } from '@shell/apis/intf/resources-api/resources-api';
import { ResourceInstance } from '@shell/apis/intf/resources-api/resource-instance';
import { ResourceInstanceImpl } from './resource-instance-class';
import { SteveListResponse, SteveGetResponse } from '@shell/types/rancher/steve.api';
import { Store } from 'vuex';

export class ResourcesApiClassImpl implements ResourcesApi {
  private store: Store<any>;

  private storeType: 'cluster' | 'management' | string;

  private surfaceError(message: string): never {
    console.error(`Resource API error - ${ this.storeType } - ${ message }`); // eslint-disable-line no-console
    throw new Error(`Resource API error - ${ this.storeType } - ${ message }`);
  }

  constructor(store: Store<any>, storeType: 'cluster' | 'management' | string) {
    this.store = store;
    this.storeType = storeType;
  }

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
   * import type { Pod } from '@shell/types/resources';
   *
   * const resources = useResources();
   * const pod = await resources.cluster.find<Pod>(K8S.POD, 'my-pod-123');
   * console.log(pod.spec.containers);
   * ```
   */
  async find<T = SteveGetResponse>(
    resourceType: ResourceType,
    resourceId: string,
    options?: FindMethodOptions
  ): Promise<ResourceInstance<T> | null> {
    try {
      const resource = await this.store.dispatch(`${ this.storeType }/find`, {
        type: resourceType,
        id:   resourceId,
        opt:  options || {}
      });

      if (!resource) {
        return null;
      }

      return new ResourceInstanceImpl(resource) as unknown as ResourceInstance<T>;
    } catch (e: unknown) {
      this.surfaceError(`Failed to find resource ${ resourceType }/${ resourceId }: ${ (e as Error).message }`);
    }
  }

  /**
   * Finds resources of a specific type with filtering, pagination, and label selector support.
   *
   * Under the hood, this dispatches `findLabelSelector` which handles both paginated listing
   * and label selector matching depending on whether server-side pagination is enabled.
   *
   * @template T - The type of the resources (defaults to SteveListResponse)
   * @param resourceType - The type of the resources to find (use **{@link K8S}** constant). See also {@link ResourceType}.
   * @param options - Optional pagination, filter, and label selector options
   * @returns An array of resource items or an empty array if none are found.
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   * import type { Deployment, Pod } from '@shell/types/resources';
   *
   * const resources = useResources();
   *
   * // Paginated listing
   * const deployments = await resources.cluster.findFiltered<Deployment>(K8S.DEPLOYMENT);
   *
   * // With label selector
   * const pods = await resources.cluster.findFiltered<Pod>(K8S.POD, { selector: 'app=nginx,env=prod' });
   * ```
   */
  async findFiltered<T = SteveListResponse>(
    resourceType: ResourceType,
    options?: FindFilteredMethodOptions
  ): Promise<T[]> {
    try {
      const { selector, ...rest } = options || {};

      const resources = await this.store.dispatch(`${ this.storeType }/findLabelSelector`, {
        type: resourceType,
        selector,
        opt:  rest
      });

      return resources as T[];
    } catch (e: unknown) {
      this.surfaceError(`Failed to find filtered resources ${ resourceType }: ${ (e as Error).message }`);
    }
  }

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
   * import type { Pod } from '@shell/types/resources';
   *
   * const resources = useResources();
   *
   * // Fetch all pods in specific namespaces
   * const pods = await resources.cluster.findAll<Pod>(K8S.POD, {
   *   namespaced: ['default', 'kube-system']
   * });
   * ```
   */
  async findAll<T = SteveListResponse>(
    resourceType: ResourceType,
    options?: FindAllMethodOptions
  ): Promise<T[]> {
    try {
      const resources = await this.store.dispatch(`${ this.storeType }/findAll`, {
        type: resourceType,
        opt:  options || {}
      });

      return resources as T[];
    } catch (e: unknown) {
      this.surfaceError(`Failed to find all resources ${ resourceType }: ${ (e as Error).message }`);
    }
  }
}
