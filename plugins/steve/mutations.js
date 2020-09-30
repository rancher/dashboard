import Vue from 'vue';
import { addObject, addObjects, clear, removeObject } from '@/utils/array';
import { SCHEMA } from '@/config/types';
import { normalizeType, KEY_FIELD_FOR } from './normalize';
import { proxyFor } from './resource-proxy';

function registerType(state, type) {
  let cache = state.types[type];

  if ( !cache ) {
    cache = {
      list:         [],
      haveAll:      false,
      haveSelector: {}
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

  // Inject special fields for indexing schemas
  if ( type === SCHEMA ) {
    data._id = normalizeType(data.id);
    data._group = normalizeType(data.attributes?.group);
  }

  const id = data[keyField];

  let cache = registerType(state, type);

  let entry;

  function replace(existing, data) {
    for ( const k of Object.keys(existing) ) {
      delete existing[k];
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

  reset(state) {
    for ( const type of Object.keys(state.types) ) {
      const cache = state.types[type];

      if ( cache ) {
        cache.haveAll = false;
        cache.haveSelector = {};
        clear(cache.list);
        cache.map.clear();
      }
    }
  },

  forgetType(state, type) {
    const cache = state.types[type];

    if ( cache ) {
      cache.haveAll = false;
      cache.haveSelector = {};
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

  setWatchStarted(state, obj) {
    const existing = state.started.find(entry => equivalentWatch(obj, entry));

    if ( !existing ) {
      addObject(state.started, obj);
    }
  },

  setWatchStopped(state, obj) {
    const existing = state.started.find(entry => equivalentWatch(obj, entry));

    if ( existing ) {
      removeObject(state.started, existing);
    } else {
      console.warn("Tried to remove a watch that doesn't exist", obj); // eslint-disable-line no-console
    }
  },

  setInError(state, msg) {
    const key = keyForSubscribe(msg);

    state.inError[key] = msg.reason;
  },

  clearInError(state, msg) {
    const key = keyForSubscribe(msg);

    delete state.inError[key];
  }
};

export function keyForSubscribe({
  resourceType, namespace, id, selector, reason
}) {
  return `${ resourceType || '' }/${ namespace || '' }/${ id || '' }/${ selector || '' }`;
}

export function equivalentWatch(a, b) {
  if ( a.type !== b.type ) {
    return false;
  }

  if ( a.id !== b.id && (a.id || b.id) ) {
    return false;
  }

  if ( a.namespace !== b.namespace && (a.namespace || b.namespace) ) {
    return false;
  }

  if ( a.selector !== b.selector && (a.selector || b.selector) ) {
    return false;
  }

  return true;
}
