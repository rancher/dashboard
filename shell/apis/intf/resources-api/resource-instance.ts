import { SteveGetResponse } from '@shell/types/rancher/steve.api';

/**
 * Instance-level operations available on resources returned by the Resources API.
 *
 * These methods operate on a specific resource that has already been fetched.
 */
export interface ResourceInstanceApi {
  /**
   * Applies a partial update to a resource using HTTP PATCH (merge-patch).
   *
   * Only the fields provided in `data` are sent to the server — the rest of the resource
   * remains unchanged. The server response is merged back into this instance.
   *
   * Requires edit permissions (`canEdit`).
   *
   * @param data - An object containing only the fields to update.
   * @returns a resource instance, updated with the server response.
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   * const configMap = await resources.cluster.find(K8S.CONFIG_MAP, 'default/my-config');
   *
   * await configMap.patch({ newKey: 'newValue' });
   * ```
   */
  patch(data: Record<string, any>): Promise<ResourceInstanceApi>;

  /**
   * Performs a full replacement update of a resource using HTTP PUT.
   *
   * Sends the entire current state of the resource to the server.
   *
   * Requires edit permissions (`canEdit`).
   *
   * @returns a resource instance, updated with the server response.
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   * const configMap = await resources.cluster.find(K8S.CONFIG_MAP, 'default/my-config');
   *
   * configMap.data.myKey = 'updatedValue';
   * await configMap.update();
   * ```
   */
  update(): Promise<ResourceInstanceApi>;

  /**
   * Deletes a resource instance.
   *
   * Requires delete permissions (`canDelete`).
   *
   * @returns A promise that resolves when the resource has been deleted.
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   * const pod = await resources.cluster.find(K8S.POD, 'default/my-pod-123');
   *
   * await pod.delete();
   * ```
   */
  delete(): Promise<void>;
}

/**
 * Represents a single resource instance returned from the Resources API.
 *
 * Provides instance-level operations such as deleting or updating a resource instance.
 * The resource data (metadata, spec, status, etc.) is accessible directly on the instance.
 *
 * @template T - The shape of the underlying resource data (defaults to SteveGetResponse)
 *
 * @example
 * ```ts
 * import { useResources, K8S } from '@shell/apis';
 *
 * const resources = useResources();
 * const pod = await resources.cluster.find(K8S.POD, 'my-pod-123');
 *
 * // Access resource data directly
 * console.log(pod.metadata.name);
 *
 * // Use instance operations
 * await pod.delete();
 * ```
 */
export type ResourceInstance<T = SteveGetResponse> = T & ResourceInstanceApi;
