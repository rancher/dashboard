import { STEVE } from '@shell/config/types';
import Schema from './schema';
import { wait } from '@shell/utils/async';

interface ResourceField {
  type: string,
  description: string,
}
type ResourceFields = { [id: string]: ResourceField }

interface SchemaDefinition {
  type: string,
  description: string,
  resourceFields: ResourceFields
}
type SchemaDefinitions = { [definitionId: string]: SchemaDefinition }

type SchemaId = {
  self: string;
  others: string[];
}
type SchemaIds = { [schemaId: string]: SchemaId }

interface SchemaDefinitionResponse {
  definitions: SchemaDefinitions,
  definitionType: string,
}

const SchemaDefinitionCache: { [store: string]: {
  ids: SchemaIds,
  definitions: SchemaDefinitions,
} } = {};

/**
 * Steve Schema specific functionality
 */
export default class SteveSchema extends Schema {
  static reset(store: string): void {
    delete SchemaDefinitionCache[store];
  }

  _resourceFields?: ResourceFields;

  /**
   * If resourceFields have not been provided, they are required to be fetched aka schemaDefinition world
   */
  requiresResourceFields: boolean;

  // These are just for typing, eventually we'll get them when Schema is fully converted to typescript
  id?: string;
  type?: string;
  links?: any;
  $ctx?: any;

  /**
   * This should match the root Schema ctor (...args throws ts error)
   */
  constructor(data: unknown, ctx: unknown, rehydrateNamespace?: null | undefined, setClone?: boolean) {
    super(data, ctx, rehydrateNamespace, setClone);

    if (!SchemaDefinitionCache[this.store]) {
      SchemaDefinitionCache[this.store] = {
        ids:         {},
        definitions: {}
      };
    }

    this.requiresResourceFields = this._resourceFields === null; // This is set pre ctor via `set'er, but TS complains that it's not initialised
  }

  // Notes on Schemas, resourceFields and schemaDefinitions
  // - Schemas previously contained a `resourceFields` collection, which is now null
  // - resourceFields now come from a new `schemaDefinitions` endpoint
  // - for neatness / safety / compatibility with norman resources... we fetch schemaDefinitions and return their resourceFields in a resourceFields getter

  /******************
   * Resource Fields
   ****************** /

  /**
   * Is the property `resourceFields` available
   *
   * If the schema definition is required and it hasn't been fetched this will be false
   *
   * This is a non-erroring request, unlike the resourceFields getter which will error if schema definition is required but missing
   */
  get hasResourceFields(): boolean {
    if (this.requiresResourceFields) {
      return !!this.schemaDefinition?.resourceFields;
    }

    return !!this._resourceFields;
  }

  /**
   * Fields associated with instances of this schema
   *
   * This will either come directly from the schema or from the schema's definition
   */
  get resourceFields(): ResourceFields {
    if (this.requiresResourceFields) {
      if (!this.schemaDefinitionsIds) {
        throw new Error(`Cannot find resourceFields for Schema ${ this.id } (schemaDefinitions have not been fetched) `);
      }

      if (!this.schemaDefinition) {
        throw new Error(`No schemaDefinition for ${ this.id } found (not in schemaDefinition response) `);
      }

      return this.schemaDefinition.resourceFields;
    }

    return this._resourceFields as ResourceFields;
  }

  /**
   * Apply the original `resourceFields` param (if it exists). If it does not then we'll need to fetch the schema definition
   */
  set resourceFields(resourceFields: ResourceFields) {
    this._resourceFields = resourceFields;
    this.requiresResourceFields = this._resourceFields === null;
  }

  /**
   * Ensure this schema has a populated `resourceFields` property
   *
   * This happens via making a request to fetch the schema definition
   */
  async fetchResourceFields(depth = 0): Promise<SchemaDefinition | null | undefined> {
    if (!this.requiresResourceFields) {
      // Not needed, no-op
      return;
    }

    if (this.schemaDefinition) {
      // Already have it, no-op
      return this.schemaDefinition;
    }

    const url = this.schemaDefinitionUrl;

    if (!url) {
      console.warn(`Unable to fetch schema definitions for ${ this.id } (failed to find url of schema definition)`); // eslint-disable-line no-console

      return;
    }

    if (depth >= 4) {
      console.warn(`Unable to fetch schema definitions for ${ this.id } (too many failed requests)`); // eslint-disable-line no-console

      return;
    }

    let res;

    try {
      // Make a direct request to fetch the schema definition
      res = await this.$dispatch('request', {
        type: STEVE.SCHEMA_DEFINITION,
        url
      });
    } catch (e: any) {
      if (e?._status === 500 || e?._status === 503) {
        // Rancher could be updating it's definition cache, attempt a few times
        await wait(2000);

        return this.fetchResourceFields(++depth);
      }

      console.warn(`Unable to fetch schema definitions for ${ this.id }`, e); // eslint-disable-line no-console

      return;
    }

    this.cacheSchemaDefinitionResponse(res);

    return this.schemaDefinition;
  }

  /**
   * Convert collection of schema definitions for this schema into objects we can store
   *
   * Split out for unit testing purposes
   */
  private cacheSchemaDefinitionResponse(res: SchemaDefinitionResponse): void {
    const { [res.definitionType]: self, ...others } = res.definitions;
    const store = this.store;

    SchemaDefinitionCache[store].ids[this.id as string] = { self: self.type, others: Object.keys(others) };
    Object.entries(res.definitions).forEach(([type, sd]) => {
      SchemaDefinitionCache[store].definitions[type] = sd;
    });
  }

  /*********************
   * Schema Definitions
   ********************* /

  /**
   * Store this schema's definition and a collection of associated definitions (all ids)
   */

  /**
   * The schema definition for this schema
   */
  get schemaDefinition(): SchemaDefinition | null {
    if (!this.schemaDefinitionsIds) {
      return null;
    }

    return SchemaDefinitionCache[this.store].definitions[this.schemaDefinitionsIds.self];
  }

  /**
   * The schema definitions for this schema definition's resourceFields
   */
  get schemaDefinitions(): SchemaDefinitions | null {
    if (!this.schemaDefinitionsIds) {
      return null;
    }

    return this.schemaDefinitionsIds.others.reduce((res, d) => {
      res[d] = SchemaDefinitionCache[this.store].definitions[d];

      return res;
    }, {} as SchemaDefinitions);
  }

  /**
   * URL to fetch this schema's definition
   */
  get schemaDefinitionUrl(): string {
    return this.links?.self?.replace('/schemas/', '/schemaDefinitions/');
  }

  /*********************
   * Local Properties
   *
   * This could be set in the ctor, however are removed in `replaceResource` when there are socket updates..
   * ... so use getters instead
   *
   *********************/

  /**
   * The name (namespace) of the vuex store this schema lives in (i.e. cluster, management, etc)
   */
  private get store(): string {
    return this.$ctx.state?.config?.namespace;
  }

  private get schemaDefinitionsIds(): SchemaId | undefined {
    return SchemaDefinitionCache[this.store]?.ids[this.id as string];
  }
}
