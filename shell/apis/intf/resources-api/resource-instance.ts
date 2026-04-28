import { SteveGetResponse } from '@shell/types/rancher/steve.api';

/**
 * Instance-level operations available on resources returned by the Resources API.
 *
 * These methods operate on a specific resource that has already been fetched.
 */
export interface ResourceInstanceApi {
  /**
   * Removes this resource from the cluster.
   *
   * @returns A promise that resolves when the resource has been deleted.
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   * const pod = await resources.cluster.find(K8S.POD, 'my-pod-123');
   *
   * await pod.remove();
   * ```
   */
  remove(): Promise<void>;

  /**
   * Returns a sanitized diff-ready representation of this resource.
   *
   * Useful for comparing resource state or preparing data for patch operations.
   *
   * @returns The cleaned resource data suitable for diffing.
   *
   * @example
   * ```ts
   * import { useResources, K8S } from '@shell/apis';
   *
   * const resources = useResources();
   * const pod = await resources.cluster.find(K8S.POD, 'my-pod-123');
   *
   * const cleanData = pod.bananas();
   * ```
   */
  bananas(): any;
}

/**
 * Represents a single resource instance returned from the Resources API.
 *
 * Provides instance-level operations such as removing or cloning a resource.
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
 * await pod.remove();
 * ```
 */
export type ResourceInstance<T = SteveGetResponse> = T & ResourceInstanceApi;
