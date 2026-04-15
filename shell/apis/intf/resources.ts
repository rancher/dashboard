
import { ClusterApi } from '@shell/apis/intf/resources-api/cluster-api';
import { MgmtApi } from '@shell/apis/intf/resources-api/mgmt-api';

export * from '@shell/apis/intf/resources-api/resources-api';
export * from '@shell/apis/intf/resources-api/cluster-api';
export * from '@shell/apis/intf/resources-api/mgmt-api';
export {
  ResourceType, FindMethodOptions, FindAllMethodOptions, FindFilteredMethodOptions
} from '@shell/apis/intf/resources-api/resource-base';
export * from '@shell/apis/intf/resources-api/resource-constants';

export { SteveGetResponse, SteveListResponse } from '@shell/types/rancher/steve.api';

/**
 * @internal
 * Top-level provider that exposes scoped resource API instances.
 *
 * @example
 * ```ts
 * import { useResources, K8S } from '@shell/apis';
 *
 * const resources = useResources();
 *
 * // Cluster-scoped resources (current cluster context)
 * const pods = await resources.cluster.findFiltered(K8S.POD);
 *
 * // Management/global resources
 * const users = await resources.mgmt.findFiltered(K8S.USER);
 * ```
 */
export interface ResourcesApiProvider {
  /**
   * Provides access to the Cluster API which can be used for managing Kubernetes cluster resources.
   * This includes Kubernetes native resources like Pods, Deployments, Services, etc.
   */
  get cluster(): ClusterApi;

  /**
   * Provides access to the Management layer in Rancher UI.
   * This includes global resources like Users, Clusters, Global Settings, etc.
   */
  get mgmt(): MgmtApi;
}
