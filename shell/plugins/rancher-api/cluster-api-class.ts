/**
 * ClusterApi extends the BaseClusterApi to provide specific functionalities for interacting with
 * resources within the current cluster context. It includes methods to create, edit, and delete
 * resources. This class is specifically designed for the $cluster context and should not be
 * confused with CAPI.
 */

import { ApiPrototype } from '@shell/types/rancher-api';
import { ResourceManageRequest } from '@shell/types/rancher-api/cluster';

import BaseClusterApi, { BaseClusterApiOptions } from './base-cluster-class';

export default class ClusterApi extends BaseClusterApi {
  constructor(options: BaseClusterApiOptions) {
    super(options);
    this.context = ApiPrototype.CLUSTER_API;
  }

  /**
   * Creates a new resource of a given type.
   *
   * @param request - An object containing the type of the resource to be created and the options for managing the resource.
   * @returns Promise<any> - Resolves with the created resource or an error if the creation fails.
   * @throws Error if a resource with the same ID already exists.
   */
  async create(request: ResourceManageRequest): Promise<any> {
    const { type, options } = request;

    const schema = this.getSchema(type);

    if ( schema && this.canManageResource(type, schema, 'create') ) {
      try {
        // Construct the ID from metadata.name and metadata.namespace
        const resourceId = options.metadata.namespace ? `${ options.metadata.namespace }/${ options.metadata.name }` : options.metadata.name;

        // Check if a resource with the same ID already exists
        const existingResource = await this.get({ type, options: { id: resourceId } });

        if ( existingResource ) {
          throw new Error(`Resource with ID ${ resourceId } already exists.`);
        }

        const resource = await this.$store.dispatch('cluster/create', {
          type,
          ...options
        });

        if ( resource ) {
          await resource.save();
        }
      } catch (e) {
        console.warn(e); // eslint-disable-line no-console
      }
    }
  }

  /**
   * Edits an existing resource of a given type.
   *
   * @param request - An object containing the type of the resource to be edited and the resource object itself.
   * @returns Promise<any> - Resolves with the edited resource or an error if the editing fails.
   */
  async edit(request: ResourceManageRequest): Promise<any> {
    const { type, resource } = request;

    const schema = this.getSchema(type);

    if ( schema && this.canManageResource(type, schema, 'edit') ) {
      try {
        if ( resource ) {
          await resource.save();
        }
      } catch (e) {
        console.warn(e); // eslint-disable-line no-console
      }
    }
  }

  /**
   * Deletes an existing resource of a given type.
   *
   * @param request - An object containing the type of the resource to be deleted and the resource object itself.
   * @returns Promise<any> - Resolves with the deleted resource or an error if the editing fails.
   */
  async delete(request: ResourceManageRequest): Promise<any> {
    const { type, resource } = request;

    const schema = this.getSchema(type);

    if ( schema && this.canManageResource(type, schema, 'delete') ) {
      try {
        if ( resource ) {
          await resource.remove();
        }
      } catch (e) {
        console.warn(e); // eslint-disable-line no-console
      }
    }
  }
}
