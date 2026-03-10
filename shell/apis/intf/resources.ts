
import { ClusterApi } from '@shell/apis/intf/resources-api/cluster-api';
import { MgmtApi } from '@shell/apis/intf/resources-api/mgmt-api';

export * from '@shell/apis/intf/resources-api/cluster-api';
export * from '@shell/apis/intf/resources-api/mgmt-api';
export * from '@shell/apis/intf/resources-api/resource-base';
export * from '@shell/apis/intf/resources-api/resource-constants';

/**
 * @internal
 * Available "API's" inside Resources API
 *
 * @example
 * ```ts
 * import { useResources, K8S } from '@shell/apis';
 * import type { Pod, Deployment } from '@shell/types/resources';
 *
 * const resources = useResources();
 *
 * // Cluster-scoped resources (current cluster context)
 * const pods = await resources.cluster.list<Pod>(K8S.POD);
 * const deployment = await resources.cluster.get<Deployment>(K8S.DEPLOYMENT, 'my-app');
 *
 * // Management/global resources
 * const users = await resources.mgmt.list(K8S.USER);
 * const cluster = await resources.mgmt.get(K8S.CLUSTER, 'c-abc123');
 * ```
 */
export interface ResourcesApi {
  /**
   * Provides access to the Cluster API which can be used for managing cluster resources in Rancher UI.
   * This includes Kubernetes native resources like Pods, Deployments, Services, etc.
   */
  get cluster(): ClusterApi;

  /**
   * Provides access to the Management layer in Rancher UI.
   * This includes global resources like Users, Clusters, Global Settings, etc.
   */
  get mgmt(): MgmtApi;
}
