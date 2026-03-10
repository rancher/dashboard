import { ResourceType, ResourceBase } from '@shell/apis/intf/resources-api/resource-base';
import { MgmtApi } from '@shell/apis/intf/resources';
import { Store } from 'vuex';

export class MgmtApiImpl implements MgmtApi {
  private store: Store<any>;

  constructor(store: Store<any>) {
    this.store = store;
  }

  /**
   * Finds a specific resource by its type and ID.
   *
   * @template T - The type of the resource (defaults to ResourceBase)
   * @param resourceType - The type of the resource to find (use K8S constants).
   * @param resourceId - The unique identifier of the resource to find.
   * @param options - Optional find arguments
   * @returns The found resource item or null if not found.
   *
   * @example
   * ```ts
   * import { K8S } from '@shell/apis';
   * import type { User } from '@shell/types/resources';
   *
   * const user = await resources.mgmt.get<User>(K8S.USER, 'u-xyz789');
   * console.log(user.username);
   * ```
   */
  async get<T extends ResourceBase = ResourceBase>(
    resourceType: ResourceType,
    resourceId: string,
    options?: any
  ): Promise<T | null> {
    try {
      const resource = await this.store.dispatch('management/find', {
        type: resourceType,
        id:   resourceId,
        opt:  options || {}
      });

      return resource as T;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Failed to get resource ${ resourceType }/${ resourceId }:`, e);

      return null;
    }
  }

  /**
   * Lists all resources of a specific type.
   *
   * @template T - The type of the resources (defaults to ResourceBase)
   * @param resourceType - The type of the resources to list (use K8S constants).
   * @param options - Optional pagination and filter options
   * @returns An array of resource items or an empty array if none are found.
   *
   * @example
   * ```ts
   * import { K8S } from '@shell/apis';
   * import type { User } from '@shell/types/resources';
   *
   * const users = await resources.mgmt.list<User>(K8S.USER);
   * users.forEach(u => console.log(u.username));
   * ```
   */
  async list<T extends ResourceBase = ResourceBase>(
    resourceType: ResourceType,
    options?: any
  ): Promise<T[]> {
    try {
      const resources = await this.store.dispatch('management/findAll', {
        type: resourceType,
        opt:  options || {}
      });

      return resources as T[];
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Failed to list resources ${ resourceType }:`, e);

      return [];
    }
  }

  /**
   * Finds resources based on a label selector string.
   *
   * @template T - The type of the resources (defaults to ResourceBase)
   * @param selector - The label selector string to filter resources (e.g., "app=nginx,env=prod").
   * @param options - Optional find arguments
   * @returns An array of resource items that match the label selector or an empty array if none are found.
   *
   * @example
   * ```ts
   * import type { Cluster } from '@shell/types/resources';
   *
   * const clusters = await resources.mgmt.labelSelector<Cluster>('status=active');
   * clusters.forEach(c => console.log(c.metadata.name));
   * ```
   */
  async labelSelector<T extends ResourceBase = ResourceBase>(
    selector: string,
    options?: any
  ): Promise<T[]> {
    try {
      const resources = await this.store.dispatch('management/findLabelSelector', {
        selector,
        opt: options || {}
      });

      return resources as T[];
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Failed to find resources with selector ${ selector }:`, e);

      return [];
    }
  }
}
