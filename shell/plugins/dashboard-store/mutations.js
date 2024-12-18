import { reactive } from 'vue';
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
      /**
       * If the cached list only contains resources for a namespace, this will contain the ns name
       */
      haveNamespace: undefined,
      /**
       * If the cached list only contains resources from a pagination request, this will contain the pagination settings (`StorePagination`)
       */
      havePage:      undefined,
      /**
       * The highest known resourceVersion from the server for this type
       */
      revision:      0,
      /**
       * Updated every time something is loaded for this type
       */
      generation:    0,
      /**
       * Used to cancel incremental loads if the page changes during load
       */
      loadCounter:   0,

      // Not enumerable so they don't get sent back to the client for SSR
      map: new Map(),
    };

    state.types[type] = cache;
  }

  return cache;
}

export function replace(existing, data) {
  const existingPropertyMap = {};

  for ( const k of Object.keys(existing) ) {
    delete existing[k];
    existingPropertyMap[k] = true;
  }

  let newProperty = false;

  for ( const k of Object.keys(data) ) {
    if (!newProperty && !existingPropertyMap[k]) {
      newProperty = true;
    }

    existing[k] = data[k];
  }

  return newProperty ? reactive(existing) : existing;
}

function replaceResource(existing, data, getters) {
  data = getters.cleanResource(existing, data);

  return replace(existing, data);
}

/**
 * `load` can be called as part of a loop. to avoid common look ups create them up front and pass as `cachedArgs`
 */
export function createLoadArgs(ctx, dataType) {
  const { getters } = ctx;
  const type = normalizeType(dataType);
  const keyField = getters.keyFieldForType(type);
  const opts = ctx.rootGetters[`type-map/optionsFor`](type);

  return {
    type, keyField, opts
  };
}

export function load(state, {
  data, ctx, existing, cachedArgs
}) {
  const { getters } = ctx;
  // Optimisation. This can run once per resource loaded.., so pass in from parent
  const { type: cachedType, keyField, opts } = cachedArgs || createLoadArgs(ctx, data.type);
  let type = cachedType;

  const limit = opts?.limit;

  // Inject special fields for indexing schemas
  if ( type === SCHEMA ) {
    addSchemaIndexFields(data);
  }

  const id = data[keyField];

  let cache = registerType(state, type);

  cache.generation++;

  let entry = cache.map.get(id);
  const inMap = !!entry;

  //
  // Determine the `entry` that should be in the local map and list cache
  //
  if ( existing && !existing.id ) {
    // A specific proxy instance to use was passed in (for create -> save), use it instead of making a new proxy
    // `existing` is a classified resource created locally that is most probably not in the store (unless a slow connection means it's added by socket before the API responds)
    // Note - `existing` has no `id` because the resource was created locally and not supplied by Rancher API

    // Get the latest and greatest version of the resource
    const latestEntry = replaceResource(existing, data, getters);

    if (inMap) {
      // There's already an entry in the store, so merge changes into it. The list entry is a reference to the map (and vice versa)
      entry = replaceResource(entry, latestEntry, getters);
    } else {
      // There's no entry, using existing proxy
      entry = latestEntry;
    }
  } else {
    if (inMap) {
      // There's already an entry in the store, so merge changes into it. The list entry is a reference to the map (and vice versa)
      entry = replaceResource(entry, data, getters);
    } else {
      // There's no entry, make a new proxy
      entry = reactive(classify(ctx, data));
    }
  }

  //
  // Ensure the `entry` is in both both list and cache
  // Note - We should be safe assuming the two collections have parity (not in map means not in list)
  //
  if (!inMap) {
    cache.list.push(entry);
    cache.map.set(id, entry);
  }

  // If there is a limit to the number of resources we can store for this type then
  // remove the first one to keep the list size to that limit
  if (limit && cache.list.length > limit) {
    const rm = cache.list.shift();

    cache.map.delete(rm.id);
  }

  if ( data.baseType ) {
    type = normalizeType(data.baseType);
    cache = state.types[type];
    if ( cache ) {
      addObject(cache.list, entry);
      cache.map.set(id, entry);
    }
  }

  cache.havePage = false;

  return entry;
}

export function forgetType(state, type) {
  const cache = state.types[type];

  if ( cache ) {
    cache.haveAll = false;
    cache.haveSelector = {};
    cache.haveNamespace = undefined;
    cache.havePage = undefined;
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
        const classyResource = reactive(classify(ctx, resource));

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
  const proxies = reactive(data.map((x) => classify(ctx, x)));
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
    if (namespace) {
      cache.havePage = false;
      cache.haveNamespace = namespace;
      cache.haveAll = false;
    } else {
      cache.havePage = false;
      cache.haveNamespace = false;
      cache.haveAll = true;
    }
  }

  return proxies;
}

/**
 * Add a set of resources to the store for a given type
 *
 * Don't mark the 'haveAll' field - this is used for incremental loading
 */
export function loadAdd(state, { type, data: allLatest, ctx }) {
  const { getters } = ctx;
  const keyField = getters.keyFieldForType(type);
  const cachedArgs = createLoadArgs(ctx, allLatest?.[0]?.type);

  allLatest.forEach((entry) => {
    const existing = state.types[type].map.get(entry[keyField]);

    load(state, {
      data: entry, ctx, existing, cachedArgs
    });
  });
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

  /**
   * Load multiple different types of resources
   */
  loadMulti(state, { data, ctx }) {
    // console.log('### Mutation loadMulti', data?.length);

    for ( const entry of data ) {
      load(state, { data: entry, ctx });
    }
  },

  /**
   * Load the results of a request that used a selector (like label)
   */
  loadSelector(state, {
    type, entries, ctx, selector, revision
  }) {
    const cache = registerType(state, type);
    const cachedArgs = createLoadArgs(ctx, entries?.[0]?.type);

    for ( const data of entries ) {
      load(state, {
        data, ctx, cachedArgs
      });
    }

    cache.haveSelector[selector] = true;
    cache.revision = revision || 0;
  },

  /**
   * Load the results of a request to fetch all resources or all resources in a namespace
   */
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
    const cachedArgs = createLoadArgs(ctx, allLatest?.[0].type);

    allLatest.forEach((entry) => {
      const existing = state.types[type].map.get(entry[keyField]);

      load(state, {
        data: entry, ctx, existing, cachedArgs
      });
    });
    cache.list.forEach((entry) => {
      if (!allLatest.find((toLoadEntry) => toLoadEntry.id === entry.id)) {
        commit('remove', entry);
      }
    });
  },

  /**
   * Load resources, but don't set `haveAll`
   */
  loadAdd,

  /**
   * Load the results of a request for a page. Often used to exercise advanced filtering
   */
  loadPage(state, {
    type,
    data,
    ctx,
    pagination,
  }) {
    if (!data) {
      return;
    }

    const keyField = ctx.getters.keyFieldForType(type);
    const proxies = reactive(data.map((x) => classify(ctx, x)));
    const cache = registerType(state, type);

    clear(cache.list);
    cache.map.clear();
    cache.generation++;

    addObjects(cache.list, proxies);

    for ( let i = 0 ; i < proxies.length ; i++ ) {
      cache.map.set(proxies[i][keyField], proxies[i]);
    }

    // havePage is of type `StorePagination`
    cache.havePage = pagination;
    cache.haveNamespace = undefined;
    cache.haveAll = undefined;

    return proxies;
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
