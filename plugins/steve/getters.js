import { SCHEMA } from '@/config/types';
import { COLLECTION_TYPES, PRIMITIVE_TYPES } from '@/config/schema';
import { matches } from '@/utils/selector';
import { typeMunge, typeRef, SIMPLE_TYPES } from '@/utils/create-yaml';
import { normalizeType, keyFieldFor, KEY_FIELD_FOR } from './normalize';
import urlOptions from './urloptions';
import mutations from './mutations';

export default {
  all: (state, getters) => (type) => {
    type = getters.normalizeType(type);

    if ( !getters.typeRegistered(type) ) {
      // Yes this is mutating state in a getter... it's not the end of the world..
      // throw new Error(`All of ${ type } is not loaded`);
      console.warn(`All of ${ type } is not loaded yet`); // eslint-disable-line no-console
      mutations.registerType(state, type);
    }

    return state.types[type].list;
  },

  matching: (state, getters) => (type, selector) => {
    const all = getters['all'](type);

    return all.filter((obj) => {
      return matches(obj, selector);
    });
  },

  byId: (state, getters) => (type, id) => {
    type = getters.normalizeType(type);
    const entry = state.types[type];

    if ( entry ) {
      return entry.map.get(id);
    }
  },

  expandedArraySchema: (state, getters) => (type) => {
    const unwrappedType = type.match(new RegExp(`^${ COLLECTION_TYPES.array }\\[(.*)\\]$`))[1];

    return {
      type:            COLLECTION_TYPES.array,
      subType:         unwrappedType,
      expandedSubType: getters.expandedSchema(unwrappedType)
    };
  },

  expandedMapSchema: (state, getters) => (type) => {
    const unwrappedType = type.match(new RegExp(`^${ COLLECTION_TYPES.map }\\[(.*)\\]$`))[1];

    return {
      type:            COLLECTION_TYPES.map,
      subType:         unwrappedType,
      expandedSubType: getters.expandedSchema(unwrappedType)
    };
  },

  expandedResourceFields: (state, getters) => (schema) => {
    return Object.keys(schema.resourceFields || {}).reduce((agg, key) => {
      const field = schema.resourceFields[key];

      return {
        ...agg,
        [key]: getters.expandedSchema(field)
      };
    }, {});
  },

  expandedSchema: (state, getters) => (typeInput) => {
    const type = (typeof typeInput === 'string') ? typeInput : (typeInput.type || typeInput.id);

    if (Object.values(PRIMITIVE_TYPES).includes(type)) {
      return { type, isPrimitive: true };
    }

    const schema = getters.schema(type) || { type: typeInput };

    if (type.startsWith(COLLECTION_TYPES.array)) {
      return getters.expandedArraySchema(type);
    }

    if (type.startsWith(COLLECTION_TYPES.map)) {
      return getters.expandedMapSchema(type);
    }

    if (!schema.resourceFields) {
      return schema;
    }

    const keyField = keyFieldFor(type);

    return {
      ...schema,
      type:                   schema[keyField],
      expandedResourceFields: getters.expandedResourceFields(schema)
    };
  },

  pathExistsInSchema: (state, getters) => (type, path) => {
    let schema = getters.expandedSchema(type);
    const splitPath = path.split('.');

    while (splitPath.length > 0) {
      const pathPart = splitPath.shift();

      if (schema?.expandedResourceFields?.[pathPart]) {
        schema = schema.expandedResourceFields[pathPart];
        continue;
      }

      if (schema.expandedSubType?.expandedResourceFields?.[pathPart]) {
        schema = schema.expandedSubType.expandedResourceFields[pathPart];
        continue;
      }

      return false;
    }

    return true;
  },

  // @TODO resolve difference between this and schemaFor and have only one of them.
  schema: (state, getters) => (type) => {
    type = getters.normalizeType(type);
    const schemas = state.types[SCHEMA];
    const keyField = KEY_FIELD_FOR[SCHEMA] || KEY_FIELD_FOR['default'];

    return schemas.list.find((x) => {
      const thisOne = getters.normalizeType(x[keyField]);

      return thisOne === type || thisOne.endsWith(`.${ type }`);
    });
  },

  // Fuzzy search to find a matching schema name for plugins/lookup
  schemaName: (state, getters) => (type) => {
    type = getters.normalizeType(type);
    const schemas = state.types[SCHEMA];
    const keyField = KEY_FIELD_FOR[SCHEMA] || KEY_FIELD_FOR['default'];
    const entries = schemas.list.filter((x) => {
      const thisOne = getters.normalizeType(x[keyField]);

      return thisOne === type || thisOne.endsWith(`.${ type }`);
    }).map((x) => {
      return x[keyField];
    }).sort((a, b) => {
      return a.length - b.length;
    });

    if ( entries[0] ) {
      return entries[0];
    }

    return type;
  },

  // Fuzzy is only for plugins/lookup, do not use in real code
  schemaFor: (state, getters) => (type, fuzzy = false, allowThrow = true) => {
    const schemas = state.types[SCHEMA];

    type = getters.normalizeType(type);

    if ( !schemas ) {
      if ( allowThrow ) {
        throw new Error("Schemas aren't loaded yet");
      } else {
        return null;
      }
    }

    const out = schemas.map.get(type);

    if ( !out && fuzzy ) {
      const close = getters.schemaName(type);

      if ( close ) {
        return getters.schemaFor(close);
      }
    }

    return out;
  },

  defaultFor: (state, getters) => (type) => {
    const schema = getters['schemaFor'](type);

    if ( !schema ) {
      return null;
    }

    const out = {};

    for ( const key in schema.resourceFields ) {
      const field = schema.resourceFields[key];

      if ( !field ) {
        // Not much to do here...
        continue;
      }

      const type = typeMunge(field.type);
      const mapOf = typeRef('map', type);
      const arrayOf = typeRef('array', type);
      const referenceTo = typeRef('reference', type);

      if ( mapOf || type === 'map' || type === 'json' ) {
        out[key] = getters.defaultFor(type);
      } else if ( arrayOf || type === 'array' ) {
        out[key] = [];
      } else if ( referenceTo ) {
        out[key] = undefined;
      } else if ( SIMPLE_TYPES.includes(type) ) {
        if ( typeof field['default'] === 'undefined' ) {
          out[key] = undefined;
        } else {
          out[key] = field['default'];
        }
      } else {
        out[key] = getters.defaultFor(type);
      }
    }

    return out;
  },

  canList: (state, getters) => (type) => {
    const schema = getters.schemaFor(type);

    return schema && schema.hasLink('collection');
  },

  typeRegistered: (state, getters) => (type) => {
    type = getters.normalizeType(type);

    return !!state.types[type];
  },

  typeEntry: (state, getters) => (type) => {
    type = getters.normalizeType(type);

    return state.types[type];
  },

  haveAll: (state, getters) => (type) => {
    type = getters.normalizeType(type);
    const entry = state.types[type];

    if ( entry ) {
      return entry.haveAll || false;
    }

    return false;
  },

  haveSelector: (state, getters) => (type, selector) => {
    type = getters.normalizeType(type);
    const entry = state.types[type];

    if ( entry ) {
      return entry.haveSelector[selector] || false;
    }

    return false;
  },

  normalizeType: () => (type) => {
    return normalizeType(type);
  },

  urlFor: (state, getters) => (type, id, opt) => {
    opt = opt || {};
    type = getters.normalizeType(type);
    let url = opt.url;

    if ( !url ) {
      const schema = getters.schemaFor(type);

      if ( !schema ) {
        throw new Error(`Unknown schema for type: ${ type }`);
      }

      url = schema.links.collection;
      if ( id ) {
        url += `/${ id }`;
      }
    }

    if ( !url.startsWith('/') && !url.startsWith('http') ) {
      const baseUrl = state.config.baseUrl.replace(/\/$/, '');

      url = `${ baseUrl }/${ url }`;
    }

    url = urlOptions(url, opt);

    return url;
  },

  storeName: (state) => {
    return state.config.namespace;
  }
};
