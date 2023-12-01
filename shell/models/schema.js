import Resource from '@shell/plugins/dashboard-store/resource-class';
import { STEVE } from '@shell/config/types';

/*
Original approach, add resourceFields getter here which returns schemaDefinitions, ensure fetchResourceFields is called in places where needed
- messy, unravelled

- TODO: RC list breaking
- TODO: RC test ingress showX model props
- TODO: RC michael - /v1/schemas/rke-machine-config.cattle.io.openstackconfig has resourceFields. ok if all are primitive. if not will look for schema's for them.. which won't be there?
// /v1/schema/schema/rke-machine.cattle.io.openstackmachine
// /v1/schema/schema/rke-machine.cattle.io.openstackmachinetemplate
// /v1/schemaDefinitions/rke-machine-config.cattle.io.openstackconfig does exist
*/

const schemaDefinitionCache = {};

export default class Schema extends Resource {
  // _resourceFields;
  // requiresSchemaDefinitions = true; // TODO: RC should only be true if steve

  // constructor(...args) {
  //   super(...args);
  // }

  get groupName() {
    return this.attributes.namespaced ? 'ns' : 'cluster';
  }

  // ---------

  get hasResourceFields() {
    if (this.requiresSchemaDefinitions) {
      return !!this._schemaDefinitions?.self?.resourceFields;
    }

    return this._resourceFields;
  }

  get resourceFields() {
    if (this.requiresSchemaDefinitions) {
      if (!this._schemaDefinitions) {
        debugger;
        throw new Error(`Cannot find resourceFields for Schema ${ this.id } (schemaDefinitions have not been fetched) `);
      }

      if (!this._schemaDefinitions.self.resourceFields) {
        throw new Error(`No schemaDefinition for ${ this.id } found (not in schemaDefinition response) `);
      }

      return this._schemaDefinitions.self.resourceFields;
    }

    return this._resourceFields;
  }

  set resourceFields(resourceFields) {
    this._resourceFields = resourceFields;
    this.requiresSchemaDefinitions = this._resourceFields === null;
  }

  _schemaDefinitions;
  get schemaDefinitions() {
    if (!this._schemaDefinitions) {
      return null;
    }

    return {
      self:   this._schemaDefinitions.self, // TODO: RC keep? bin?
      others: this._schemaDefinitions.others.reduce((res, d) => {
        res[d] = this.$getters['byId'](STEVE.SCHEMA_DEFINITION, d); // TODO: RC Avoid the store (performance). just cache here.

        return res;
      }, {})
    };
  }

  async fetchResourceFields() {
    if (!this.requiresSchemaDefinitions) {
      return;
    }

    if (this._schemaDefinitions?.self) {
      return this._schemaDefinitions?.self;
    }

    const res = await this.$dispatch('request', {
      type: STEVE.SCHEMA_DEFINITION,
      url:  `/v1/schemaDefinitions/${ this.id }` // TODO: RC Michael. url creation looks at links.collection. can have but no collectionMethods? determine local / kube id
    });

    // TODO: RC Michale resourceFields.x.create|update
    const schemaDefinitionsIdsFromSchema = [];
    const schemaDefinitionsForStore = [];
    let self;

    // Convert collection of schema definitions for this schema into objects we can store
    // sdfdsf store as individual
    Object.entries(res.definitions).forEach(([id, d]) => {
      schemaDefinitionsIdsFromSchema.push(id);
      const def = {
        ...d,
        type: STEVE.SCHEMA_DEFINITION,
        id:   d.type // TODO: RC
      };

      if (id === res.definitionType) {
        self = def;
      } else {
        schemaDefinitionsForStore.push(def);
      }
    });

    this._schemaDefinitions = {
      self, // TODO: RC convert to id
      others: schemaDefinitionsIdsFromSchema
    };

    await this.$dispatch('loadMulti', schemaDefinitionsForStore);
  }
}

export function parseType(str, field) { // TODO: RC test
  if ( str.startsWith('array[') ) {
    return ['array', ...parseType(str.slice(6, -1))];
  } else if (str.startsWith('array')) {
    return ['array', field.subtype]; // schemaDefinition
  } else if ( str.startsWith('map[') ) {
    return ['map', ...parseType(str.slice(4, -1))];
  } else if (str.startsWith('map')) {
    return ['map', field.subtype]; // schemaDefinition
  } else {
    return [str];
  }
}
