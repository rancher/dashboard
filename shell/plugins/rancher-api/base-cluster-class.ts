/**
 * BaseClusterApi serves as a foundational class for interacting with cluster-related APIs in a Vuex store context.
 * It provides methods for managing resources, fetching resource types, and constructing dispatch parameters.
 */

import { Store } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import { Schema } from '@shell/types/rancher-api';
import { ResourceFetchOptions } from '@shell/types/rancher-api/cluster';

interface BaseClusterApiOptions {
  store: Store<any>;
}

export default class BaseClusterApi {
  protected $store: Store<any>;

  constructor(options: BaseClusterApiOptions) {
    this.$store = options.store;
  }

  /**
   * Retrieves the schema for a given type from the Vuex store.
   *
   * @param type - The type of schema to be retrieved.
   * @returns The schema corresponding to the given type, or undefined if not found.
   */
  protected getSchema(type: string): Schema | undefined {
    return this.$store.getters['cluster/schemaFor'](type);
  }

  /**
   * Determines if a resource of a given type can be managed (created, edited, or deleted).
   *
   * @param type - The type of the resource.
   * @param schema - The schema associated with the resource type.
   * @param action - The action to be performed on the resource ('create', 'edit', 'delete').
   * @returns Boolean - True if the resource can be managed in the specified manner, false otherwise.
   */
  protected canManageResource(type: string, schema: Schema, action: 'create' | 'edit' | 'delete'): Boolean {
    let method: string;
    let isAllowed: boolean | undefined;

    switch ( action ) {
    case 'create':
      method = 'post';
      isAllowed = schema?.collectionMethods?.some((x: string) => x.toLowerCase() === method);
      break;
    case 'edit':
      method = 'patch';
      isAllowed = schema?.resourceMethods?.some((x: string) => x.toLowerCase() === method);
      break;
    case 'delete':
      method = 'delete';
      isAllowed = schema?.resourceMethods?.some((x: string) => x.toLowerCase() === method);
      break;
    default:
      throw new Error('Invalid action specified');
    }

    if ( !isAllowed ) {
      return false;
    }

    switch ( action ) {
    case 'create':
      return this.$store.getters['type-map/optionsFor'](type).isCreatable;
    case 'edit':
      return this.$store.getters['type-map/optionsFor'](type).isEditable;
    case 'delete':
      return this.$store.getters['type-map/optionsFor'](type).isRemovable;
    }
  }

  /**
   * Helper function to build dispatch parameters for Vuex store actions.
   *
   * @param type - The resource schema ID.
   * @param options - Additional options for fetching resources.
   * @returns An object containing dispatch parameters.
   */
  private buildDispatchParams(type: string, options: ResourceFetchOptions = {}) {
    const params: { [key: string]: any } = { type };

    for (const [key, value] of Object.entries(options)) {
      params[key] = value;
    }

    return params;
  }

  /**
   * Fetch a resource type to return either a full list of resources by type, a singular resource
   * by type and ID, or a list of resources by type that match specific label criteria defined in the
   * selector. This is useful for filtering resources based on their metadata labels.
   * The `force` option can be used to initiate a new dispatch request regardless of any existing cache.
   *
   * @param type The resource schema ID.
   * @param options? Additional fetching options: `id?`, `selector?`, `namespace?`, `force?`.
   *  - `id`: Specify the ID of the resource for fetching a single item.
   *  - `selector`: A string used to match resources based on their labels.
   *                The format is 'key=value', where 'key' is the label name and 'value' is the label value.
   *                For example, 'app=kubewarden-policy-server-default' would match resources labeled with
   *                'app' as 'kubewarden-policy-server-default'.
   *  - `namespace`: Specify the namespace of the resource (if applicable).
   *  - `force`: Force a new dispatch request, bypassing any cached data.
   *
   * @returns `Promise<any>` A promise that resolves with the fetched resource(s).
   */
  async get(type: string, options?: ResourceFetchOptions): Promise<any> {
    if ( this.getSchema(type) ) {
      try {
        const params = this.buildDispatchParams(type, options);

        // Assume the user wants all of the resource type
        if ( isEmpty(options) ) {
          return await this.$store.dispatch('cluster/findAll', params);
        }

        // Fetch matching resource based on selector
        if ( options?.selector ) {
          return await this.$store.dispatch('cluster/findMatching', params);
        }

        // Fetch resource by ID
        if ( options?.id ) {
          return await this.$store.dispatch('cluster/find', params);
        }
      } catch (e) {
        console.warn(e); // eslint-disable-line no-console
      }
    }
  }
}
