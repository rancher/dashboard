import Vue from 'vue';
import { normalizeType, KEY_FIELD_FOR } from './normalize';
import ResourceProxy from './resource-proxy';
import { addObject, addObjects, clear, removeObject } from '@/utils/array';

export default {
  updateSocket(state, obj) {
    state.socket.status = obj.status;
    state.socket.count = obj.count || 0;
  },

  rehydrateProxies(state) {
    if ( !process.client ) {
      return;
    }

    Object.keys(state.types).forEach((type) => {
      const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];
      const cache = state.types[type];
      const map = new Map();

      for ( let i = 0 ; i < cache.list.length ; i++ ) {
        const proxy = proxyFor(cache.list[i]);

        cache.list[i] = proxy;
        map.set(proxy[keyField], proxy);
      }

      Vue.set(cache, 'map', map);
      Vue.set(state.types, type, state.types[type]);
    });
  },

  applyConfig(state, config) {
    if ( !state.config ) {
      state.config = {};
    }

    Object.assign(state.config, config);
  },

  registerType(state, type) {
    if ( !state.types[type] ) {
      const obj = {
        list:    [],
        haveAll:   false,
      };

      // Not enumerable so they don't get sent back to the client for SSR
      Object.defineProperty(obj, 'map', { value: new Map() });

      state.types[type] = obj;
    }
  },

  loadAll(state, { type, data }) {
    const cache = state.types[type];
    const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];

    clear(cache.list);
    cache.map.clear();

    const proxies = data.map(x => proxyFor(x));

    addObjects(cache.list, proxies);

    for ( let i = 0 ; i < data.length ; i++ ) {
      cache.map.set(data[i][keyField], proxies[i]);
    }

    cache.haveAll = true;
  },

  load(state, resource) {
    const type = normalizeType(resource.type);
    const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];
    const id = resource[keyField];
    const cache = state.types[type];
    const entry = cache.map.get(id);

    if ( entry ) {
      Object.assign(entry, resource);
    } else {
      const proxy = proxyFor(resource);

      addObject(cache.list, proxy);
      cache.map.set(id, proxy);
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

function proxyFor(obj) {
  return new Proxy(obj, {
    get(target, name) {
      const fn = ResourceProxy[name];

      if ( fn ) {
        return fn.apply(target);
      }

      return target[name];
    },
  });
}
