import {
  ResourceType, CreateResourceData, FindMethodOptions, FindAllMethodOptions, FindFilteredPageOptions, FindFilteredLabelSelectorOptions,
  FindFilteredPageResponse, FindFilteredLabelSelectorResponse
} from '@shell/apis/intf/resources-api/resource-base';
import { ResourceInstance } from '@shell/apis/intf/resources-api/resource-instance';
import { ResourcesApi } from '@shell/apis/intf/resources-api/resources-api';
import { ResourceInstanceImpl } from '@shell/apis/resources/resource-instance-class';
import { SteveListResponse, SteveGetResponse } from '@shell/types/rancher/steve.api';
import { Store } from 'vuex';

export class ResourcesApiClassImpl implements ResourcesApi {
  private store: Store<any>;

  private storeType: 'cluster' | 'management' | string;

  private surfaceError(message: string, e?: any): never {
    console.error(`Resource API error - ${ this.storeType } - ${ message }`); // eslint-disable-line no-console
    throw new Error(`Resource API error - ${ this.storeType } - ${ message }`, { cause: e });
  }

  private resourceUrl(resourceType: ResourceType, resourceId: string): string {
    if (this.isNamespaced(resourceType) && !resourceId.includes('/')) {
      this.surfaceError(`Resource "${ resourceType }" is namespaced. The resourceId must be in "namespace/name" format, but received "${ resourceId }"`);
    }

    const schema = this.store.getters[`${ this.storeType }/schemaFor`]?.(resourceType);

    if (!schema) {
      this.surfaceError(`No schema found for type "${ resourceType }"`);
    }

    return `${ schema.linkFor('collection') }/${ resourceId }`;
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
  async find<T = SteveGetResponse>(
    resourceType: ResourceType,
    resourceId: string,
    options?: FindMethodOptions
  ): Promise<T | null> {
    if (this.isNamespaced(resourceType) && !resourceId.includes('/')) {
      this.surfaceError(`Resource "${ resourceType }" is namespaced. The resourceId must be in "namespace/name" format, but received "${ resourceId }"`);
    }

    try {
      const resource = await this.store.dispatch(`${ this.storeType }/find`, {
        type: resourceType,
        id:   resourceId,
        opt:  options || {}
      });

      return resource ? new ResourceInstanceImpl(resource) as T : null;
    } catch (e: unknown) {
      this.surfaceError(`Failed to find resource ${ resourceType }/${ resourceId }: ${ (e as Error).message }`, e);
    }
  }

  /**
   * Finds resources using pagination mode with server-side filtering, sorting, and pagination.
   *
   * Requires `ui-sql-cache` to be enabled.
   *
   * @template T - The type of the resources (defaults to SteveListResponse)
   * @param resourceType - The type of the resources to find
   * @param options - Pagination options with server-side filtering and sorting
   * @returns Response containing resource items (may be transient if requested, otherwise cached array)
   * @throws If pagination mode is requested but `ui-sql-cache` is not enabled
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
   * @param resourceType - The type of the resources to find
   * @param options - Label selector options for filtering
   * @returns Response containing resource items (may be transient if requested, otherwise cached array)
   */
  findFiltered<T = SteveListResponse>(
    resourceType: ResourceType,
    options: FindFilteredLabelSelectorOptions
  ): Promise<FindFilteredLabelSelectorResponse<T>>;

  /**
   * @internal Implementation - use one of the overloads above
   */
  async findFiltered<T = SteveListResponse>(
    resourceType: ResourceType,
    options: FindFilteredPageOptions | FindFilteredLabelSelectorOptions
  ): Promise<FindFilteredPageResponse<T> | FindFilteredLabelSelectorResponse<T>> {
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

        if (Array.isArray(response)) {
          return response.map((r: any) => new ResourceInstanceImpl(r)) as FindFilteredPageResponse<T>;
        }

        if (response?.data) {
          response.data = response.data.map((r: any) => new ResourceInstanceImpl(r));
        }

        return response as FindFilteredPageResponse<T>;
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

        if (Array.isArray(resources)) {
          return resources.map((r: any) => new ResourceInstanceImpl(r)) as FindFilteredLabelSelectorResponse<T>;
        }

        if (resources?.data) {
          resources.data = resources.data.map((r: any) => new ResourceInstanceImpl(r));
        }

        return resources as FindFilteredLabelSelectorResponse<T>;
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

      return (resources || []).map((r: any) => new ResourceInstanceImpl(r)) as T[];
    } catch (e: unknown) {
      this.surfaceError(`Failed to find all resources ${ resourceType }: ${ (e as Error).message }`, e);
    }
  }

  /**
   * Creates a new resource.
   *
   * Classifies the data via the store, checks `canCreate` permissions, and persists via HTTP POST.
   *
   * @template T - The type of the resource (defaults to ResourceInstance)
   * @param data - The resource data to create. Must include a `type` property (use **{@link K8S}** constant). See also {@link CreateResourceData}.
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
  async create<T = ResourceInstance>(
    data: CreateResourceData
  ): Promise<T> {
    try {
      const model = await this.store.dispatch(`${ this.storeType }/create`, data);

      if (!model.canCreate) {
        this.surfaceError(`Cannot create resource of type "${ data.type }": permission denied`);
      }

      await model.save();

      return new ResourceInstanceImpl(model) as T;
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
   * @template T - The type of the response (defaults to ResourceInstance)
   * @param resourceType - The type of the resource (use **{@link K8S}** constant). See also {@link ResourceType}.
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
   * const result = await resources.cluster.patch(K8S.CONFIG_MAP, 'default/my-config', {
   *   data: { newKey: 'newValue' }
   * });
   * ```
   */
  async patch<T = ResourceInstance>(
    resourceType: ResourceType,
    resourceId: string,
    data: Record<string, any>
  ): Promise<T> {
    try {
      const url = this.resourceUrl(resourceType, resourceId);
      const res = await this.store.dispatch(`${ this.storeType }/request`, {
        opt: {
          url,
          method:  'patch',
          headers: { 'content-type': 'application/merge-patch+json' },
          data,
        }
      });

      return res as T;
    } catch (e: unknown) {
      this.surfaceError(`Failed to patch resource ${ resourceType }/${ resourceId }: ${ (e as Error).message }`, e);
    }
  }

  /**
   * Performs a full replacement update of a resource using HTTP PUT.
   *
   * Runs `cleanForSave` on the data before sending.
   * This is a raw HTTP operation — it does not check permissions or update the store cache.
   *
   * @template T - The type of the response (defaults to ResourceInstance)
   * @param resourceType - The type of the resource (use **{@link K8S}** constant). See also {@link ResourceType}.
   * @param resourceId - The unique identifier. If namespaced, use `namespace/name` format.
   * @param data - The complete resource data to send as the replacement.
   * @returns The server response.
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   *
   * const result = await resources.cluster.update(K8S.CONFIG_MAP, 'default/my-config', {
   *   type:     'configmap',
   *   metadata: { name: 'my-config', namespace: 'default', resourceVersion: '12345' },
   *   data:     { key: 'replacedValue' }
   * });
   * ```
   */
  async update<T = ResourceInstance>(
    resourceType: ResourceType,
    resourceId: string,
    data: Record<string, any>
  ): Promise<T> {
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

      return res as T;
    } catch (e: unknown) {
      this.surfaceError(`Failed to update resource ${ resourceType }/${ resourceId }: ${ (e as Error).message }`, e);
    }
  }

  /**
   * Deletes a resource by type and ID using HTTP DELETE.
   *
   * This is a raw HTTP operation — it does not check permissions or update the store cache.
   *
   * @param resourceType - The type of the resource (use **{@link K8S}** constant). See also {@link ResourceType}.
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
