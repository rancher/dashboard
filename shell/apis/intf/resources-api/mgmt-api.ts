import { ResourcesApi } from './resources-api';

/**
 * @interface
 * Provides access to the Management layer in Rancher UI (users, global settings, etc.)
 *
 * @example
 * ```ts
 * import { useResources, K8S } from '@shell/apis';
 * import type { User, Cluster } from '@shell/types/resources';
 *
 * const resources = useResources();
 *
 * // Type-safe with generics
 * const users = await resources.mgmt.findFiltered<User>(K8S.USER);
 * users[0].username; // typed!
 *
 * const cluster = await resources.mgmt.find<Cluster>(K8S.CLUSTER, 'c-abc123');
 * cluster.spec.displayName; // typed!
 * ```
 */
export type MgmtApi = ResourcesApi
