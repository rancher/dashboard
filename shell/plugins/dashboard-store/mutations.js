import Vue from 'vue';
import { addObject, addObjects, clear, removeObject } from '@shell/utils/array';
import { SCHEMA, COUNT } from '@shell/config/types';
import { normalizeType, keyFieldFor } from '@shell/plugins/dashboard-store/normalize';
import { addSchemaIndexFields } from '@shell/plugins/steve/schema.utils';
import { classify } from '@shell/plugins/dashboard-store/classify';
import garbageCollect from '@shell/utils/gc/gc';

function registerType(state, type) {
  let cache = state.types[type];

  if ( !cache ) {
    cache = {
      list:          [],
      haveAll:       false,
      haveSelector:  {},
      haveNamespace: undefined, // If the cached list only contains resources for a namespace, this will contain the ns name
      revision:      0, // The highest known resourceVersion from the server for this type
      generation:    0, // Updated every time something is loaded for this type
      loadCounter:   0, // Used to cancel incremental loads if the page changes during load
    };

    // Not enumerable so they don't get sent back to the client for SSR
    Object.defineProperty(cache, 'map', { value: new Map() });

    Vue.set(state.types, type, cache);
  }

  return cache;
}

export function replace(existing, data) {
  for ( const k of Object.keys(existing) ) {
    delete existing[k];
  }

  for ( const k of Object.keys(data) ) {
    Vue.set(existing, k, data[k]);
  }

  return existing;
}

function replaceResource(existing, data, getters) {
  data = getters.cleanResource(existing, data);

  return replace(existing, data);
}

export function load(state, { data, ctx, existing }) {
  const { getters } = ctx;
  let type = normalizeType(data.type);
  const keyField = getters.keyFieldForType(type);
  const opts = ctx.rootGetters[`type-map/optionsFor`](type);
  const limit = opts?.limit;

  // Inject special fields for indexing schemas
  if ( type === SCHEMA ) {
    addSchemaIndexFields(data);
  }

  const id = data[keyField];

  let cache = registerType(state, type);

  cache.generation++;

  let entry;

  if ( existing && !existing.id ) {
    // A specific proxy instance to used was passed in (for create -> save),
    // use it instead of making a new proxy
    entry = replaceResource(existing, data, getters);
    addObject(cache.list, entry);
    cache.map.set(id, entry);
    // console.log('### Mutation added from existing proxy', type, id);
  } else {
    entry = cache.map.get(id);

    if ( entry ) {
      // There's already an entry in the store, update it
      replaceResource(entry, data, getters);
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
    cache.haveNamespace = undefined;
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

export function batchChanges(state, { ctx, batch }) {
  const batchTypes = Object.keys(batch);
  const combinedBatch = {};

  batchTypes.forEach((batchType) => {
    combinedBatch[batchType] = batch[batchType];
    const typeOption = ctx.rootGetters['type-map/optionsFor'](batchType);

    if (typeOption?.alias?.length > 0) {
      const alias = typeOption?.alias || [];

      alias.forEach((aliasType) => {
        combinedBatch[aliasType] = {};
        for (const [key, value] of Object.entries(batch[batchType])) {
          combinedBatch[aliasType][key] = {
            ...value,
            type: aliasType
          };
        }
      });
    }
  });

  const combinedBatchTypes = Object.keys(combinedBatch);

  combinedBatchTypes.forEach((type) => {
    const normalizedType = normalizeType(type === 'counts' ? COUNT : type);
    const keyField = keyFieldFor(normalizedType);
    const typeCache = registerType(state, normalizedType);

    // making a map for every resource's location in the list is gonna ensure we only have to loop through the big list once.
    const typeCacheIndexMap = {};

    typeCache.list.forEach((resource, index) => {
      typeCacheIndexMap[resource[keyField]] = index;
    });

    const removeAtIndexes = [];

    // looping through the batch, executing changes, deferring creates and removes since they change the array length
    Object.keys(combinedBatch[normalizedType]).forEach((id) => {
      const index = typeCacheIndexMap[id];
      const resource = combinedBatch[normalizedType][id];

      // an empty resource passed into batch changes is how we'll signal which ones to delete
      if (Object.keys(resource).length === 0 && index !== undefined) {
        typeCache.map.delete(id);
        removeAtIndexes.push(index);
      } else if (Object.keys(resource).length === 0) {
        // No op. We're removing it... but we don't have it in the cache
      } else {
        if (normalizedType === SCHEMA) {
          addSchemaIndexFields(resource);
        }
        const classyResource = classify(ctx, resource);

        if (index === undefined) {
          typeCache.list.push(classyResource);
          typeCache.map.set(id, classyResource);

          typeCacheIndexMap[classyResource[keyField]] = typeCache.list.length - 1;
        } else {
          replaceResource(typeCache.list[index], resource, ctx.getters);
        }
      }
    });

    // looping through the removeAtIndexes, making sure to offset by iteration so the array changing doesn't mess us up
    removeAtIndexes.sort().forEach((cacheIndex, loopIndex) => {
      typeCache.list.splice(cacheIndex - loopIndex, 1);
    });

    const opts = ctx.rootGetters[`type-map/optionsFor`](type);
    const limit = opts?.limit;

    // If there is a limit to the number of resources we can store for this type then
    // remove the first one to keep the list size to that limit
    if (limit && typeCache.list.length > limit) {
      const rm = typeCache.list.shift();

      typeCache.map.delete(rm.id);
    }

    typeCache.generation++;
  });
}

export function loadAll(state, {
  type,
  data,
  ctx,
  skipHaveAll,
  namespace,
  revision
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
  const proxies = data.map((x) => classify(ctx, x));
  const cache = registerType(state, type);

  clear(cache.list);
  cache.map.clear();
  cache.revision = revision || 0;
  cache.generation++;

  addObjects(cache.list, proxies);

  for ( let i = 0 ; i < proxies.length ; i++ ) {
    cache.map.set(proxies[i][keyField], proxies[i]);
  }

  // Allow requester to skip setting that everything has loaded
  if (!skipHaveAll) {
    cache.haveNamespace = namespace;
    cache.haveAll = !namespace;
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
    type, entries, ctx, selector, revision
  }) {
    const cache = registerType(state, type);

    for ( const data of entries ) {
      load(state, { data, ctx });
    }

    cache.haveSelector[selector] = true;
    cache.revision = revision || 0;
  },

  loadAll,

  /**
   * Handles changes (add, update, remove) to multiple resources for multiple types
   */
  batchChanges,

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
      if (!allLatest.find((toLoadEntry) => toLoadEntry.id === entry.id)) {
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

  setHaveNamespace(state, { type, namespace }) {
    const cache = registerType(state, type);

    cache.haveNamespace = namespace;
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
