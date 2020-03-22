import { normalizeType, KEY_FIELD_FOR } from './normalize';
import { proxyFor } from './resource-proxy';
import { addObject, addObjects, clear, removeObject } from '@/utils/array';

export default {
  applyConfig(state, config) {
    if ( !state.config ) {
      state.config = {};
    }

    Object.assign(state.config, config);
  },

  registerType(state, type) {
    if ( !state.types[type] ) {
      const cache = {
        list:    [],
        haveAll: false,
      };

      // Not enumerable so they don't get sent back to the client for SSR
      Object.defineProperty(cache, 'map', { value: new Map() });

      if ( process.server ) {
        Object.defineProperty(cache.list, '__rehydrateAll', { value: type, enumerable: true });
      }

      state.types[type] = cache;
    }
  },

  loadAll(state, { type, data, ctx }) {
    if (!data) {
      return;
    }
    const cache = state.types[type];
    const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];

    clear(cache.list);
    cache.map.clear();

    if ( process.server ) {
      Object.defineProperty(cache.list, '__rehydrateAll', { value: type, enumerable: true });
    }

    const proxies = data.map(x => proxyFor(ctx, x));

    addObjects(cache.list, proxies);

    for ( let i = 0 ; i < data.length ; i++ ) {
      cache.map.set(data[i][keyField], proxies[i]);
    }

    cache.haveAll = true;
  },

  load(state, { data, ctx, existing }) {
    let type = normalizeType(data.type);
    const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];

    const id = data[keyField];

    let cache = state.types[type];

    let entry = cache.map.get(id);

    if ( existing ) {
      // A specific proxy instance to used was passed in (for create -> save),
      // use it instead of making a new proxy
      entry = existing;
      Object.assign(entry, data);
      cache.map.set(id, entry);
    } else if ( entry ) {
      // There's already an entry in the store, update it
      Object.assign(entry, data);
    } else {
      // There's no entry, make a new proxy
      entry = proxyFor(ctx, data);
      addObject(cache.list, entry);
      cache.map.set(id, entry);
    }

    if ( data.baseType ) {
      type = normalizeType(data.baseType);
      cache = state.types[type];
      if ( cache ) {
        addObject(cache.list, entry);
        cache.map.set(id, entry);
      }
    }
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
