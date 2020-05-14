import Vue from 'vue';
import { normalizeType, KEY_FIELD_FOR } from './normalize';
import { proxyFor } from './resource-proxy';
import { addObject, addObjects, clear, removeObject } from '@/utils/array';

function registerType(state, type) {
  let cache = state.types[type];

  if ( !cache ) {
    cache = {
      list:    [],
      haveAll: false,
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
  let type = normalizeType(data.type);
  const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];

  const id = data[keyField];

  let cache = registerType(state, type);

  let entry;

  if ( existing ) {
    // A specific proxy instance to used was passed in (for create -> save),
    // use it instead of making a new proxy
    entry = existing;
    Object.assign(entry, data);
    addObject(cache.list, entry);
    cache.map.set(id, entry);
    // console.log('### Mutation added from existing proxy', type, id);
  } else {
    entry = cache.map.get(id);

    if ( entry ) {
      // There's already an entry in the store, update it
      Object.assign(entry, data);
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

export default {
  registerType,
  load,

  applyConfig(state, config) {
    if ( !state.config ) {
      state.config = {};
    }

    Object.assign(state.config, config);
  },

  loadMulti(state, { entries, ctx }) {
    // console.log('### Mutation loadMulti', entries.length);
    for ( const data of entries ) {
      load(state, { data, ctx });
    }
  },

  loadAll(state, { type, data, ctx }) {
    if (!data) {
      return;
    }

    const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];
    const proxies = data.map(x => proxyFor(ctx, x));
    const cache = registerType(state, type);

    clear(cache.list);
    cache.map.clear();

    addObjects(cache.list, proxies);

    for ( let i = 0 ; i < data.length ; i++ ) {
      cache.map.set(data[i][keyField], proxies[i]);
    }

    cache.haveAll = true;
  },

  remove(state, obj) {
    let type = normalizeType(obj.type);
    const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];
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

  forgetAll(state) {
    for ( const type of Object.keys(state.types) ) {
      const cache = state.types[type];

      if ( cache ) {
        cache.haveAll = false;
        clear(cache.list);
        cache.map.clear();
      }
    }
  },

  forgetType(state, type) {
    const cache = state.types[type];

    if ( cache ) {
      cache.haveAll = false;
      clear(cache.list);
      cache.map.clear();
    }
  },

  setWantSocket(state, want) {
    state.wantSocket = want;
  },

  enqueuePending(state, obj) {
    state.pendingSends.push(obj);
  },

  dequeuePending(state, obj) {
    removeObject(state.pendingSends, obj);
  },

  setWatchStarted(state, type) {
    addObject(state.started, type);
  },

  setWatchStopped(state, type) {
    removeObject(state.started, type);
  },

  addNoWatch(state, type) {
    state.noWatch.push(type);
  }
};
