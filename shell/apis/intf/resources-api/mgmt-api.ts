import { ResourcesApi } from './resources-api';

/**
 * @interface
 * Provides access to the Management layer in Rancher UI (users, global settings, etc.)
 *
 * Requests are scoped to the management layer, which is global rather than tied to the cluster
 * currently being viewed. For resources inside a cluster use the Cluster API instead - see
 * {@link ClusterApi}.
 *
 * @example
 * ```ts
 * import { useResources, K8S } from '@shell/apis';
 *
 * const resources = useResources();
 *
 * const user = await resources.mgmt.find(K8S.USER, 'u-xyz789');
 * ```
 */
export type MgmtApi = ResourcesApi
