import Vue from 'vue';
import { addObject, addObjects, clear, removeObject } from '@shell/utils/array';
import { SCHEMA } from '@shell/config/types';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { classify } from '@shell/plugins/dashboard-store/classify';
import garbageCollect from '@shell/utils/gc/gc';

function registerType(state, type) {
  let cache = state.types[type];

  if ( !cache ) {
    cache = {
      list:         [],
      haveAll:      false,
      haveSelector: {},
      revision:     0, // The highest known resourceVersion from the server for this type
      generation:   0, // Updated every time something is loaded for this type
      loadCounter:  0, // Used to cancel incremental loads if the page changes during load
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

export function load(state, { data, ctx, existing }) {
  const { getters } = ctx;
  let type = normalizeType(data.type);
  const keyField = getters.keyFieldForType(type);
  const opts = ctx.rootGetters[`type-map/optionsFor`](type);
  const limit = opts?.limit;

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
    data = getters.cleanResource(existing, data);

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
      entry = classify(ctx, data);
      addObject(cache.list, entry);
      cache.map.set(id, entry);
      // console.log('### Mutation', type, id);

      // If there is a limit to the number of resources we can store for this type then
      // remove the first one to keep the list size to that limit
      if (limit && cache.list.length > limit) {
        const rm = cache.list.shift();

        cache.map.delete(rm.id);
      }
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

  return entry;
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

    garbageCollect.gcResetType(state, type);

    return true;
  }
}

export function resetStore(state, commit) {
  // eslint-disable-next-line no-console
  console.log('Reset store: ', state.config.namespace);

  for ( const type of Object.keys(state.types) ) {
    commit(`${ state.config.namespace }/forgetType`, type);
  }

  garbageCollect.gcResetStore(state);
}

export function remove(state, obj, getters) {
  if (obj) {
    let type = normalizeType(obj.type);
    const keyField = getters[`${ state.config.namespace }/keyFieldForType`](type);
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
  }
}

export function loadAll(state, {
  type,
  data,
  ctx,
  skipHaveAll
}) {
  const { getters } = ctx;

  if (!data) {
    return;
  }

  const opts = ctx.rootGetters[`type-map/optionsFor`](type);
  const limit = opts?.limit;

  // If there is a limit, only store the last elements from the list to keep to that limit
  if (limit) {
    data = data.slice(-limit);
  }

  const keyField = getters.keyFieldForType(type);
  const proxies = data.map(x => classify(ctx, x));
  const cache = registerType(state, type);

  clear(cache.list);
  cache.map.clear();
  cache.generation++;

  addObjects(cache.list, proxies);

  for ( let i = 0 ; i < proxies.length ; i++ ) {
    cache.map.set(proxies[i][keyField], proxies[i]);
  }

  // Allow requester to skip setting that everything has loaded
  if (!skipHaveAll) {
    cache.haveAll = true;
  }

  return proxies;
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
    // console.log('### Mutation loadMulti', data?.length);
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

  loadAll,

  loadMerge(state, { type, data: allLatest, ctx }) {
    const { commit, getters } = ctx;
    // const allLatest = await dispatch('findAll', { type, opt: { force: true, load, _NONE } });
    // const allExisting = getters.all({type});
    const keyField = getters.keyFieldForType(type);
    const cache = state.types[type];

    allLatest.forEach((entry) => {
      const existing = state.types[type].map.get(entry[keyField]);

      load(state, {
        data: entry, ctx, existing
      });
    });
    cache.list.forEach((entry) => {
      if (!allLatest.find(toLoadEntry => toLoadEntry.id === entry.id)) {
        commit('remove', entry);
      }
    });
  },

  // Add a set of resources to the store for a given type
  // Don't mark the 'haveAll' field - this is used for incremental loading
  loadAdd(state, { type, data: allLatest, ctx }) {
    const { getters } = ctx;
    const keyField = getters.keyFieldForType(type);

    allLatest.forEach((entry) => {
      const existing = state.types[type].map.get(entry[keyField]);

      load(state, {
        data: entry, ctx, existing
      });
    });
  },

  forgetAll(state, { type }) {
    const cache = registerType(state, type);

    clear(cache.list);
    cache.map.clear();
    cache.generation++;
  },

  setHaveAll(state, { type }) {
    const cache = registerType(state, type);

    cache.haveAll = true;
  },

  loadedAll(state, { type }) {
    const cache = registerType(state, type);

    cache.generation++;
    cache.haveAll = true;
  },

  remove(state, obj) {
    if (obj) {
      remove(state, obj, this.getters);
    }
  },

  reset(state) {
    resetStore(state, this.commit);
  },

  forgetType,

  incrementLoadCounter(state, type) {
    const typeData = state.types[type];

    if (typeData) {
      typeData.loadCounter++;
    }
  },

};
