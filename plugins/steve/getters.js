import { normalizeType, keyFieldFor, KEY_FIELD_FOR } from './normalize';
import urlOptions from './urloptions';
import mutations from './mutations';
import { SCHEMA, COLLECTION_TYPES, PRIMITIVE_TYPES } from '@/config/types';

export default {
  all: (state, getters) => (type) => {
    type = getters.normalizeType(type);

    if ( !getters.typeRegistered(type) ) {
      // Yes this is mutating state in a getter... it's not the end of the world..
      // throw new Error(`All of ${ type } is not loaded`);
      console.warn(`All of ${ type } is not loaded yet`);
      mutations.registerType(state, type);
    }

    return state.types[type].list;
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
    const type = typeof typeInput === 'string'
      ? typeInput
      : typeInput.type || typeInput.id;

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
    const entry = schemas.list.find((x) => {
      const thisOne = getters.normalizeType(x[keyField]);

      return thisOne === type || thisOne.endsWith(`.${ type }`);
    });

    if ( entry ) {
      return entry[keyField];
    }

    return type;
  },

  // Fuzzy is only for plugins/lookup, do not use in real code
  schemaFor: (state, getters) => (type, fuzzy = false) => {
    const schemas = state.types[SCHEMA];

    type = normalizeType(type);

    if ( !schemas ) {
      throw new Error("Schemas aren't loaded yet");
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

  typeRegistered: (state, getters) => (type) => {
    type = getters.normalizeType(type);

    return !!state.types[type];
  },

  haveAll: (state, getters) => (type) => {
    type = getters.normalizeType(type);
    const entry = state.types[type];

    if ( entry ) {
      return entry.haveAll;
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

  nextResourceVersion: (state, getters) => (type) => {
    type = normalizeType(type);

    const cache = state.types[type];
    let revision = 0;

    for ( const obj of cache.list ) {
      if ( obj && obj.metadata ) {
        const neu = parseInt(obj.metadata.resourceVersion, 10);

        revision = Math.max(revision, neu);
      }
    }

    if ( revision ) {
      return revision + 1;
    }

    return null;
  },

  canWatch: state => (type) => {
    return !state.noWatch.includes(type);
  },

  watchStarted: state => (type) => {
    return state.started.includes(type);
  }
};
