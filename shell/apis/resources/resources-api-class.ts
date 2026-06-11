import {
  ResourceType, CreateResourceData, FindMethodOptions, FindAllMethodOptions, FindFilteredPageOptions, FindFilteredLabelSelectorOptions,
  FindFilteredPageResponse, FindFilteredLabelSelectorResponse, SteveResource,
  FindFilteredPageOptionsTransient,
} from '@shell/apis/intf/resources-api/resource-base';
import { ResourceInstance } from '@shell/apis/intf/resources-api/resource-instance';
import { ResourcesApi } from '@shell/apis/intf/resources-api/resources-api';
import { ActionFindPageTransientResponse } from '@shell/types/store/dashboard-store.types';
import { Store } from 'vuex';

export class ResourcesApiClassImpl implements ResourcesApi {
  private store: Store<any>;

  private storeType: 'cluster' | 'management' | string;

  private createLogMessage(message: string, level: 'error' | 'warning' = 'error') {
    return `Resource API ${ level } - ${ this.storeType } - ${ message }`;
  }

  private surfaceWarning(message: string, e?: any): void {
    console.warn(this.createLogMessage(message, 'warning'), e); // eslint-disable-line no-console
  }

  private surfaceError(message: string, e?: any): never {
    console.error(this.createLogMessage(message), e); // eslint-disable-line no-console

    throw new Error(`Resource API error - ${ this.storeType } - ${ message }`, { cause: e });
  }

  private resourceUrl(resourceType: ResourceType, resourceId?: string): string {
    if (this.isNamespaced(resourceType) && resourceId && !resourceId.includes('/')) {
      if (!resourceId) {
        this.surfaceError(`Resource "${ resourceType }" is namespaced`);
      } else {
        this.surfaceError(`Resource "${ resourceType }" is namespaced. The resourceId must be in "namespace/name" format, but received "${ resourceId }"`);
      }
    }

    return this.store.getters[`${ this.storeType }/urlFor`](resourceType, resourceId);
  }

  private isNamespaced(resourceType: ResourceType): boolean {
    const schema = this.store.getters[`${ this.storeType }/schemaFor`]?.(resourceType);

    return !!schema?.attributes?.namespaced;
  }

  constructor(store: Store<any>, storeType: 'cluster' | 'management' | string) {
    this.store = store;
    this.storeType = storeType;
  }

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
  async find<T = Record<string, any>>(
    resourceType: ResourceType,
    resourceId: string,
    options?: FindMethodOptions
  ): Promise<ResourceInstance<T> | null> {
    if (this.isNamespaced(resourceType) && !resourceId.includes('/')) {
      this.surfaceError(`Resource "${ resourceType }" is namespaced. The resourceId must be in "namespace/name" format, but received "${ resourceId }"`);
    }

    try {
      const resource = await this.store.dispatch(`${ this.storeType }/find`, {
        type: resourceType,
        id:   resourceId,
        opt:  options || {}
      });

      return resource as ResourceInstance<T>;
    } catch (e: unknown) {
      if ((e as any)?.status === 404) {
        this.surfaceWarning(`Failed to find resource ${ resourceType }/${ resourceId }: ${ (e as Error).message }`, e);

        return null;
      }

      this.surfaceError(`Failed to find resource ${ resourceType }/${ resourceId }: ${ (e as Error).message }`, e);
    }
  }

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
   */
  findFiltered<T = Record<string, any>>(
    resourceType: ResourceType,
    options: FindFilteredPageOptions
  ): Promise<ResourceInstance<T>[]>;

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
   */
  findFiltered<T = Record<string, any>>(
    resourceType: ResourceType,
    options: FindFilteredPageOptionsTransient
  ): Promise<ActionFindPageTransientResponse<ResourceInstance<T>>>;

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
   * @returns Response containing resource items.
   *
   */
  findFiltered<T = Record<string, any>>(
    resourceType: ResourceType,
    options: FindFilteredLabelSelectorOptions
  ): Promise<FindFilteredLabelSelectorResponse<ResourceInstance<T>>>;

  /**
   * @internal Implementation - use one of the overloads above
   */
  async findFiltered<T = Record<string, any>>(
    resourceType: ResourceType,
    options: FindFilteredPageOptions | FindFilteredLabelSelectorOptions | FindFilteredPageOptionsTransient
  ): Promise<FindFilteredPageResponse<ResourceInstance<T>> | FindFilteredLabelSelectorResponse<ResourceInstance<T>>> {
    try {
      if ('pagination' in options) { // pagination mode
        const canPaginate = this.store.getters[`${ this.storeType }/paginationEnabled`]?.(resourceType);

        if (!canPaginate) {
          return this.surfaceError('findFiltered requests with FindFilteredPageOptions are only supported when ui-sql-cache is enabled');
        }

        const safeOption = options as FindFilteredPageOptions;
        const response = await this.store.dispatch(`${ this.storeType }/findPage`, {
          type: resourceType,
          opt:  safeOption
        });

        if (options.transient) {
          return response as ResourceInstance<T>[];
        }

        return response as FindFilteredPageResponse<ResourceInstance<T>>;
      } else if ('labelSelector' in options) { // label selector mode
        const safeOption = options as FindFilteredLabelSelectorOptions;
        const { labelSelector, namespaced, ...rest } = safeOption;
        const resources = await this.store.dispatch(`${ this.storeType }/findLabelSelector`, {
          type:     resourceType,
          matching: {
            namespace: namespaced,
            labelSelector
          },
          opt: rest
        });

        return resources as FindFilteredLabelSelectorResponse<ResourceInstance<T>>;
      } else {
        return this.surfaceError('findFiltered request was made with unknown options');
      }
    } catch (e: unknown) {
      this.surfaceError(`Failed to find filtered resources ${ resourceType }: ${ (e as Error).message }`, e);
    }
  }

  /**
   * Fetches all resources of a specific type with advanced options.
   * This method provides additional capabilities like incremental loading and namespace filtering.
   *
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @param resourceType - The type of the resources to find (examples in **{@link K8S}**). See also {@link ResourceType}.
   * @param options - Optional advanced fetch options (incremental loading, namespace filtering, etc.)
   * @returns An array of resource items or an empty array if none are found.
   */
  async findAll<T = Record<string, any>>(
    resourceType: ResourceType,
    options?: FindAllMethodOptions
  ): Promise<ResourceInstance<T>[]> {
    try {
      const resources = await this.store.dispatch(`${ this.storeType }/findAll`, {
        type: resourceType,
        opt:  options || {}
      });

      return (resources || []) as ResourceInstance<T>[];
    } catch (e: unknown) {
      this.surfaceError(`Failed to find all resources ${ resourceType }: ${ (e as Error).message }`, e);
    }
  }

  /**
   * Creates a new resource.
   *
   * The `data` object must include a `type` property identifying the resource type.
   * This is a raw HTTP operation — it does not check permissions or update the store cache.
   *
   * @template T - Your specific resource type. Rancher will supplement the response with additional properties and methods
   * @param data - The resource data to create. Must include a `type` property (examples in **{@link K8S}**). See also {@link CreateResourceData}.
   * @returns The created resource instance.
   */
  async create<T = Record<string, any>, I = SteveResource<T>>(
    data: CreateResourceData
  ): Promise<I> {
    try {
      if (!data.type) {
        return this.surfaceError('Resource data must include a "type" property');
      }

      const url = this.resourceUrl(data.type);

      const res = await this.store.dispatch(`${ this.storeType }/request`, {
        opt: {
          url,
          method:  'POST',
          headers: { 'content-type': 'application/json' },
          data,
        }
      });

      return res as I;
    } catch (e: unknown) {
      this.surfaceError(`Failed to create resource of type "${ data.type }": ${ (e as Error).message }`, e);
    }
  }

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
   */
  async update<T = Record<string, any>, I = SteveResource<T>>(
    resourceType: ResourceType,
    resourceId: string,
    data: Record<string, any>
  ): Promise<I> {
    try {
      const url = this.resourceUrl(resourceType, resourceId);
      const res = await this.store.dispatch(`${ this.storeType }/request`, {
        opt: {
          url,
          method:  'patch',
          headers: { 'content-type': 'application/strategic-merge-patch+json' },
          data,
        }
      });

      return res as I;
    } catch (e: unknown) {
      this.surfaceError(`Failed to update resource ${ resourceType }/${ resourceId }: ${ (e as Error).message }`, e);
    }
  }

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
   */
  async replace<T = Record<string, any>, I = SteveResource<T>>(
    resourceType: ResourceType,
    resourceId: string,
    data: Record<string, any>
  ): Promise<I> {
    try {
      const url = this.resourceUrl(resourceType, resourceId);
      const model = await this.store.dispatch(`${ this.storeType }/create`, data);
      const cleanData = model.cleanForSave({ ...data });
      const res = await this.store.dispatch(`${ this.storeType }/request`, {
        opt: {
          url,
          method:  'put',
          headers: { 'content-type': 'application/json' },
          data:    cleanData,
        }
      });

      return res as I;
    } catch (e: unknown) {
      this.surfaceError(`Failed to update resource ${ resourceType }/${ resourceId }: ${ (e as Error).message }`, e);
    }
  }

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
  async delete(
    resourceType: ResourceType,
    resourceId: string
  ): Promise<void> {
    try {
      const url = this.resourceUrl(resourceType, resourceId);

      await this.store.dispatch(`${ this.storeType }/request`, {
        opt: {
          url,
          method: 'delete',
        }
      });
    } catch (e: unknown) {
      this.surfaceError(`Failed to delete resource ${ resourceType }/${ resourceId }: ${ (e as Error).message }`, e);
    }
  }
}
