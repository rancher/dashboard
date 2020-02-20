import { normalizeType, KEY_FIELD_FOR } from './normalize';
import urlOptions from './urloptions';
import { SCHEMA } from '@/config/types';

export default {
  all: (state, getters) => (type) => {
    type = getters.normalizeType(type);

    if ( getters.hasType(type) ) {
      return state.types[type].list;
    } else {
      throw new Error(`All of ${ type } is not loaded`);
    }
  },

  byId: (state, getters) => (type, id) => {
    type = getters.normalizeType(type);
    const entry = state.types[type];

    if ( entry ) {
      return entry.map.get(id);
    }
  },

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

  hasType: (state, getters) => (type) => {
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
  }
};
