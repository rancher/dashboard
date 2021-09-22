import Vue from 'vue';
import { addObject, addObjects, clear, removeObject } from '@/utils/array';
import { SCHEMA } from '@/config/types';
import { normalizeType } from '@/plugins/core-store/normalize';
import { proxyFor, remapSpecialKeys } from '@/plugins/core-store/resource-proxy';
import { Resource } from '@/plugins/core-store/resource-class';

function registerType(state, type) {
  let cache = state.types[type];

  if ( !cache ) {
    cache = {
      list:         [],
      haveAll:      false,
      haveSelector: {},
      revision:     0, // The highest known resourceVersion from the server for this type
      generation:   0, // Updated every time something is loaded for this type
    };

    // Not enumerable so they don't get sent back to the client for SSR
    Object.defineProperty(cache, 'map', { value: new Map() });

    if ( process.server && !cache.list.__rehydrateAll ) {
      Object.defineProperty(cache.list, '__rehydrateAll', { value: `${ state.config.namespace }/${ type }`, enumerable: true });
    }

    Vue.set(state.types, type, cache);
  }

  return cache;
}

function load(state, { data, ctx, existing }) {
  const { getters } = ctx;
  let type = normalizeType(data.type);
  const keyField = getters.keyFieldForType(type);

  // Inject special fields for indexing schemas
  if ( type === SCHEMA ) {
    data._id = normalizeType(data.id);
    data._group = normalizeType(data.attributes?.group);
  }

  const id = data[keyField];

  let cache = registerType(state, type);

  cache.generation++;

  let entry;

  function replace(existing, data) {
    for ( const k of Object.keys(existing) ) {
      delete existing[k];
    }

    if ( !(existing instanceof Resource) ) {
      remapSpecialKeys(data);
    }

    for ( const k of Object.keys(data) ) {
      Vue.set(existing, k, data[k]);
    }

    return existing;
  }

  if ( existing && !existing.id ) {
    // A specific proxy instance to used was passed in (for create -> save),
    // use it instead of making a new proxy
    entry = replace(existing, data);
    addObject(cache.list, entry);
    cache.map.set(id, entry);
    // console.log('### Mutation added from existing proxy', type, id);
  } else {
    entry = cache.map.get(id);

    if ( entry ) {
      // There's already an entry in the store, update it
      replace(entry, data);
      // console.log('### Mutation Updated', type, id);
    } else {
      // There's no entry, make a new proxy
      entry = proxyFor(ctx, data);
      addObject(cache.list, entry);
      cache.map.set(id, entry);
      // console.log('### Mutation', type, id);
    }
  }

  if ( data.baseType ) {
    type = normalizeType(data.baseType);
    cache = state.types[type];
    if ( cache ) {
      addObject(cache.list, entry);
      cache.map.set(id, entry);
    }
  }
}

export function forgetType(state, type) {
  const cache = state.types[type];

  if ( cache ) {
    cache.haveAll = false;
    cache.haveSelector = {};
    cache.revision = 0;
    cache.generation = 0;
    clear(cache.list);
    cache.map.clear();
    delete state.types[type];

    return true;
  }
}

export function resetStore(state, commit) {
  // eslint-disable-next-line no-console
  console.log('Reset', state.config.namespace);

  for ( const type of Object.keys(state.types) ) {
    commit(`${ state.config.namespace }/forgetType`, type);
  }
}

export default {
  registerType,
  load,

  applyConfig(state, config) {
    if ( !state.config ) {
      state.config = {};
    }

    Object.assign(state.config, config);
  },

  loadMulti(state, { data, ctx }) {
    // console.log('### Mutation loadMulti', data.length);
    for ( const entry of data ) {
      load(state, { data: entry, ctx });
    }
  },

  loadSelector(state, {
    type, entries, ctx, selector
  }) {
    const cache = registerType(state, type);

    for ( const data of entries ) {
      load(state, { data, ctx });
    }

    cache.haveSelector[selector] = true;
  },

  loadAll(state, { type, data, ctx }) {
    const { getters } = ctx;

    if (!data) {
      return;
    }

    const keyField = getters.keyFieldForType(type);
    const proxies = data.map(x => proxyFor(ctx, x));
    const cache = registerType(state, type);

    clear(cache.list);
    cache.map.clear();
    cache.generation++;

    addObjects(cache.list, proxies);

    for ( let i = 0 ; i < data.length ; i++ ) {
      cache.map.set(data[i][keyField], proxies[i]);
    }

    cache.haveAll = true;
  },

  remove(state, obj) {
    let type = normalizeType(obj.type);
    const keyField = this.getters[`${ state.config.namespace }/keyFieldForType`](type);
    const id = obj[keyField];

    let entry = state.types[type];

    if ( entry ) {
      removeObject(entry.list, obj);
      entry.map.delete(id);
    }

    if ( obj.baseType ) {
      type = normalizeType(obj.baseType);
      entry = state.types[type];

      if ( entry ) {
        removeObject(entry.list, obj);
        entry.map.delete(id);
      }
    }
  },

  reset(state) {
    resetStore(state, this.commit);
  },

  forgetType,
};
