import { STEVE } from '@shell/config/types';
import Schema from './schema';

/*
PR Description
- Major Changes
  - createYaml requires schema's resourceFields. This field now comes from schemaDefinitions (rather than schema) and has to be up front fetched
  - plugins/fieldsForDriver and plugins/fieldNamesForDriver getters now handle schema definitions via a fetch in the `createPopulated` action
  - upfront fetch a schema's associated schema definitions resource in additional misc places (clusterscan, ingress, alertmanagerconfig)
  - createPopulated is now async and fetches resource fields. this ensures defaultFor has access to resourceFields

- Improvements
  - CruResource now creates yaml when it's needed, rather than when we visit the component in form view (avoids blocking load of component to fetch schema definitions)
  - pathExistsInSchema has now moved to a steve/norman specific place and works with both norman and steve schemas
  - model/resource validationErrors functionality has been split between steve specific resourceFields in steve model and core validation in root resource-class model
    - steve validationErrors is skipped for prefs (which would have required a blocking http request on dashboard load)

- Approach
  - Originally, add resourceFields getter here which returns schemaDefinitions, ensure fetchResourceFields is called in places where needed
    - messy, unravelled

- TODO: RC test ingress showX model props
- TODO: RC after schema change, new ones available, but definition might not be ready. should now be 503
// TODO: RC Q michael - how often does the cache update, is blocked?
// TODO: RC Q michael - Install monitoring in ui. load /v1/schemaDefinition/monitoring.coreos.com.alertmanagerconfig. initiallg
{
"type": "error",
"links": { },
"code": "InternalServerError",
"message": "error refreshing schemas",
"status": 500
}. then have response
*/

/**
 * Steve Schema specific functionality
 */
export default class SteveSchema extends Schema {
  /**
   * Is the property `resourceFields` available
   *
   * If the schema definition is required and it hasn't been fetched this will be false
   *
   * This is a non-erroring request, unlike the resourceFields getter which will error if schema definition is required but missing
   */
  get hasResourceFields() {
    if (this.requiresSchemaDefinitions) {
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
    if (this.requiresSchemaDefinitions) {
      if (!this._schemaDefinitionsIds) {
        debugger; // TODO: RC polish - remove
        throw new Error(`Cannot find resourceFields for Schema ${ this.id } (schemaDefinitions have not been fetched) `);
      }

      if (!this.schemaDefinition) {
        debugger; // TODO: RC polish - remove
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
    this.requiresSchemaDefinitions = this._resourceFields === null;
  }

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
    return this.links?.self?.replace('/schemas/', '/schemaDefinitions/'); // TODO: RC test in downstream cluster
  }

  /**
   * Fetch the schema definition which will provide the resourceFields
   */
  async fetchResourceFields(depth = 0) {
    if (!this.requiresSchemaDefinitions) {
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
}
