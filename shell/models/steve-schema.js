import { STEVE } from '@shell/config/types';
import Schema from './schema';

/**
 * Steve Schema specific functionality
 */
export default class SteveSchema extends Schema {
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
  get hasResourceFields() {
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
  get resourceFields() {
    if (this.requiresResourceFields) {
      if (!this._schemaDefinitionsIds) {
        throw new Error(`Cannot find resourceFields for Schema ${ this.id } (schemaDefinitions have not been fetched) `);
      }

      if (!this.schemaDefinition) {
        throw new Error(`No schemaDefinition for ${ this.id } found (not in schemaDefinition response) `);
      }

      return this.schemaDefinition.resourceFields;
    }

    return this._resourceFields;
  }

  /**
   * Apply the original `resourceFields` param (if it exists). If it does not then we'll need to fetch the schema definition
   */
  set resourceFields(resourceFields) {
    this._resourceFields = resourceFields;
    this.requiresResourceFields = this._resourceFields === null;
  }

  /**
   * Ensure this schema has a populated `resourceFields` property
   *
   * This happens via making a request to fetch the schema definition
   */
  async fetchResourceFields(depth = 0) {
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
    } catch (e) {
      if ( e?._status >= 500) {
        // Rancher could be updating it's definition cache, attempt a few times
        await new Promise((resolve) => setTimeout(resolve, 2000));

        return this.fetchResourceFields(++depth);
      }

      console.warn(`Unable to fetch schema definitions for ${ this.id }`, e); // eslint-disable-line no-console

      return;
    }

    const schemaDefinitionsIdsFromSchema = [];
    const schemaDefinitionsForStore = [];

    // Convert collection of schema definitions for this schema into objects we can store
    Object.entries(res.definitions).forEach(([id, d]) => {
      schemaDefinitionsForStore.push({
        ...d, // Note - this doesn't contain create or update properties as previous. These were previously hardcoded and also not used in the ui
        type: STEVE.SCHEMA_DEFINITION,
        id:   d.type
      });

      if (id !== res.definitionType) {
        schemaDefinitionsIdsFromSchema.push(id);
      }
    });

    this._schemaDefinitionsIds = {
      self:   res.definitionType,
      others: schemaDefinitionsIdsFromSchema
    };

    // Store all schema definitions in the store
    // - things in the store are larger in size ... but avoids duplicating the same schema definitions in multiple models
    // - these were originally stored in a singleton map in this file... however it'd need to tie into the cluster unload flow
    //   - if the size gets bad we can do this plumbing
    await this.$dispatch('loadMulti', schemaDefinitionsForStore);
  }

  /*********************
   * Schema Definitions
   ********************* /

  /**
   * Store this schema's definition and a collection of associated definitions (all ids)
   */
  _schemaDefinitionsIds;

  /**
   * The schema definition for this schema
   */
  get schemaDefinition() {
    if (!this._schemaDefinitionsIds) {
      return null;
    }

    return this.$getters['byId'](STEVE.SCHEMA_DEFINITION, this._schemaDefinitionsIds.self);
  }

  /**
   * The schema definitions for this schema definition's resourceFields
   */
  get schemaDefinitions() {
    if (!this._schemaDefinitionsIds) {
      return null;
    }

    return this._schemaDefinitionsIds.others.reduce((res, d) => {
      res[d] = this.$getters['byId'](STEVE.SCHEMA_DEFINITION, d);

      return res;
    }, {});
  }

  /**
   * URL to fetch this schema's definition
   */
  get schemaDefinitionUrl() {
    return this.links?.self?.replace('/schemas/', '/schemaDefinitions/');
  }
}
