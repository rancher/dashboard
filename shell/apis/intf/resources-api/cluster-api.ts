import { ResourcesApi } from './resources-api';

/**
 * @interface
 * Provides access to the Cluster API which can be used for managing cluster resources in Rancher UI
 *
 * @example
 * ```ts
 * import { useResources, K8S } from '@shell/apis';
 * import type { Pod, Deployment } from '@shell/types/resources';
 *
 * const resources = useResources();
 *
 * // Type-safe with generics
 * const pods = await resources.cluster.findFiltered<Pod>(K8S.POD);
 * pods[0].metadata.name; // typed!
 *
 * const deployment = await resources.cluster.find<Deployment>(K8S.DEPLOYMENT, 'my-app');
 * deployment.spec.replicas; // typed!
 * ```
 */
export type ClusterApi = ResourcesApi
