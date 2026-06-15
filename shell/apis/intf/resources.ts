
import { ClusterApi } from '@shell/apis/intf/resources-api/cluster-api';
import { MgmtApi } from '@shell/apis/intf/resources-api/mgmt-api';

export * from '@shell/apis/intf/resources-api/resources-api';
export * from '@shell/apis/intf/resources-api/cluster-api';
export * from '@shell/apis/intf/resources-api/mgmt-api';
export {
  ResourceType, FindMethodOptions, FindAllMethodOptions, FindFilteredPageOptions, FindFilteredLabelSelectorOptions,
  FindFilteredPageResponse, FindFilteredLabelSelectorResponse
} from '@shell/apis/intf/resources-api/resource-base';
export * from '@shell/apis/intf/resources-api/resource-constants';

export { SteveGetResponse, SteveListResponse } from '@shell/types/rancher/steve.api';
export { KubeLabelSelector, KubeLabelSelectorExpression } from '@shell/types/kube/kube-api';
export {
  PaginationSort, PaginationParamFilter, PaginationParamProjectOrNamespace, PaginationFilterField
} from '@shell/types/store/pagination.types';

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
 * const pod = await resources.cluster.find(K8S.POD, 'default/my-pod-123');
 *
 * // Management/global resources
 * const user = await resources.mgmt.find(K8S.USER, 'u-xyz789');
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
