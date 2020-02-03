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

  load(state, { resource, ctx }) {
    let type = normalizeType(resource.type);
    const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];
    const id = resource[keyField];
    let cache = state.types[type];
    let entry = cache.map.get(id);

    if ( entry ) {
      Object.assign(entry, resource);
    } else {
      entry = proxyFor(ctx, resource);

      addObject(cache.list, entry);
      cache.map.set(id, entry);
    }

    if ( resource.baseType ) {
      type = normalizeType(resource.baseType);
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

  removeAll(state) {
    state.types = {};
  },

  setWantSocket(state, want) {
    state.wantSocket = want;
  },

  enqueuePending(state, obj) {
    state.pendingSends.push(obj);
  },

  dequeuePending(state, obj) {
    removeObject(state.pendingSends, obj);
  }
};
