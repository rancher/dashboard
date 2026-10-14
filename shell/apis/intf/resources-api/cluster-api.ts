import { ResourcesApi } from './resources-api';

/**
 * @interface
 * Provides access to the Cluster API which can be used for managing cluster resources in Rancher UI
 *
 * Requests are scoped to the cluster currently being viewed. For global Rancher resources
 * (Users, Projects, Settings, etc.) use the Management API instead - see {@link MgmtApi}.
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
export type ClusterApi = ResourcesApi
