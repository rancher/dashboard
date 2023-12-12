/**
 * ClusterApi extends the BaseClusterApi to provide specific functionalities for interacting with
 * resources within the current cluster context. It includes methods to create, edit, and delete
 * resources. This class is specifically designed for the $cluster context and should not be
 * confused with CAPI.
 */

import { SteveResource, ResourceManageOptions } from '@shell/types/rancher-api/cluster';
import BaseClusterApi from './base-cluster-class';

export default class ClusterApi extends BaseClusterApi {
  /**
   * Creates a new resource of a given type.
   *
   * @param type - The type of the resource to be created.
   * @param options - The options for managing the resource, including metadata and spec.
   * @returns Promise<any> - Resolves with the created resource or an error if the creation fails.
   * @throws Error if a resource with the same ID already exists.
   */
  async create(type: string, options: ResourceManageOptions): Promise<any> {
    const schema = this.getSchema(type);

    if ( schema && this.canManageResource(type, schema, 'create') ) {
      try {
      // Construct the ID from metadata.name and metadata.namespace
        const resourceId = options.metadata.namespace ? `${ options.metadata.namespace }/${ options.metadata.name }` : options.metadata.name;

        // Check if a resource with the same ID already exists
        const existingResource = await this.get(type, { id: resourceId });

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
   * @param type - The type of the resource to be edited.
   * @param resource - The resource object to be edited.
   * @returns Promise<any> - Resolves with the edited resource or an error if the editing fails.
   */
  async edit(type: string, resource: SteveResource): Promise<any> {
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
   * @param type - The type of the resource to be deleted.
   * @param resource - The resource object to be deleted.
   * @returns Promise<any> - Resolves with the deleted resource or an error if the editing fails.
   */
  async delete(type: string, resource: SteveResource): Promise<any> {
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
