import { normalizeType, KEY_FIELD_FOR } from './normalize';
import { proxyFor } from './resource-proxy';
import { addObject, addObjects, clear, removeObject } from '@/utils/array';

export default {
  updateSocket(state, obj) {
    state.socket.status = obj.status;
    state.socket.count = obj.count || 0;
  },

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
    const type = normalizeType(resource.type);
    const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];
    const id = resource[keyField];
    const cache = state.types[type];
    const entry = cache.map.get(id);

    if ( entry ) {
      Object.assign(entry, resource);

      return entry;
    } else {
      const proxy = proxyFor(ctx, resource);

      addObject(cache.list, proxy);
      cache.map.set(id, proxy);

      return proxy;
    }
  },

  remove(state, { type, id }) {
    type = normalizeType(type);
    const entry = state.types[type];

    if ( !entry ) {
      return;
    }

    const obj = entry.map.get(id);

    if ( obj ) {
      removeObject(entry.list, obj);
      entry.map.delete(id);
    }
  }
};
