import { ResourcesApi } from './resources-api';

/**
 * @interface
 * Provides access to the Cluster API which can be used for managing cluster resources in Rancher UI
 *
 * @example
 * ```ts
 * import { useResources, K8S } from '@shell/apis';
 *
 * // Cluster-scoped resources (current cluster context)
 * const pod = await resources.cluster.find(K8S.POD, 'default/my-pod-123');
 *
 * // Management/global resources
 * const user = await resources.mgmt.find(K8S.USER, 'u-xyz789');
 * ```
 */
export type ClusterApi = ResourcesApi
