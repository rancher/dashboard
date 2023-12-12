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

- TODO: RC list breaking (???)
- TODO: RC test ingress showX model props
- TODO: RC michael
- /v1/schema/monitoring.coreos.com.alertmanagerconfig
-  - as we have
-  - spec.type "monitoring.coreos.com.v1alpha1.alertmanagerconfig.spec",
-  - not in /v1/schemas
   - 404 for /v1/schema/monitoring.coreos.com.v1alpha1.alertmanagerconfig.spec
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
  async fetchResourceFields() {
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
      console.warn(`Failed to find url of schema definition for schema ${ this.schema.id }`);

      return;
    }

    // Make a direct request to fetch the schema definition
    const res = await this.$dispatch('request', {
      type: STEVE.SCHEMA_DEFINITION,
      url
    });

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
