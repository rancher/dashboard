import { addObject } from '@shell/utils/array';
import { NAMESPACE, POD, SCHEMA } from '@shell/config/types';
import {
  forgetType,
  resetStore,
  loadAll,
  load,
  remove,
  batchChanges,
  replace
} from '@shell/plugins/dashboard-store/mutations';
import { keyForSubscribe } from '@shell/plugins/steve/resourceWatcher';
import { perfLoadAll } from '@shell/plugins/steve/performanceTesting';
import Vue from 'vue';
import { classify } from '@shell/plugins/dashboard-store/classify';

function registerNamespace(state, namespace) {
  let cache = state.podsByNamespace[namespace];

  if (!cache) {
    cache = {
      list: [],
      map:  new Map()
    };

    Vue.set(state.podsByNamespace, namespace, cache);
  }

  return cache;
}

/**
 * update the podsByNamespace cache with new or changed pods
 */
function updatePodsByNamespaceCache(state, ctx, pods, loadAll) {
  if (loadAll) {
    // Clear the entire cache - this is a fresh load
    Object.keys(state.podsByNamespace).forEach((ns) => {
      delete state.podsByNamespace[ns];
    });
  }

  // Go through all of the pods and populate cache by namespace
  pods.forEach((entry) => {
    const classyResource = state.types[POD].map.get(entry.id) || classify(ctx, entry);

    const cache = registerNamespace(state, classyResource.namespace); // Raw entry.namespace doesn't exist, so use classy
    const existing = cache.map.get(entry.id);

    if (existing) {
      // CANNOT BE THE SAME REFERENCE
      replace(existing, entry);
    } else {
      addObject(cache.list, classyResource);
      cache.map.set(entry.id, classyResource);
    }
  });
}

/**
 * clean the podsByNamespace cache of removed pods
 */
function cleanPodsByNamespaceCache(state, resource) {
  if (resource && resource.type === POD) {
    const cache = state.podsByNamespace[resource.namespace];

    // Extra defensive check that the cache exists for the namespace being removed
    if (cache) {
      const inList = cache.list.findIndex(p => p.id === resource.id);

      if ( inList >= 0 ) {
        cache.list.splice(inList, 1);
      }
      cache.map.delete(resource.id);
    }
  } else if (resource && resource.type === NAMESPACE) {
    // Namespace deleted
    delete state.podsByNamespace[resource.id];
  }
}

export default {
  batchChanges(state, { ctx, batch }) {
    batchChanges(state, { ctx, batch });

    if (batch[POD]) {
      const newAndChangedPods = Object.entries(batch[POD]).reduce((pods, [id, pod]) => {
        if (pod.id) {
          // resource.create and resource.change
          pods.push(pod);// must NOT be same reference from store
        } else {
          // resource.remove (note - we've already lost the resource in the store, so pass through mocked one)
          cleanPodsByNamespaceCache(state, {
            id,
            type:      POD,
            namespace: id.substring(0, id.indexOf('/'))
          });
        }

        return pods;
      }, []);

      updatePodsByNamespaceCache(state, ctx, newAndChangedPods, false);
    }

    if (batch[NAMESPACE]) {
      Object.entries(batch[NAMESPACE]).forEach(([id, namespace]) => {
        if (!namespace.id) {
          // resource.remove (note - we've already lost the resource in the store, so pass through mocked one)
          cleanPodsByNamespaceCache(state, {
            id,
            type: NAMESPACE,
          });
        }
      });
    }
  },

  loadAll(state, {
    type,
    data,
    ctx,
    skipHaveAll,
    namespace
  }) {
    // Performance testing in dev and when env var is set
    if (process.env.dev && !!process.env.perfTest) {
      data = perfLoadAll(type, data);
    }

    const proxies = loadAll(state, {
      type, data, ctx, skipHaveAll, namespace
    });

    // If we loaded a set of pods, then update the podsByNamespace cache
    if (type === POD) {
      updatePodsByNamespaceCache(state, ctx, proxies, true);
    }

    // Notify the web worker of the initial load of schemas
    if (type === SCHEMA) {
      const worker = (this.$workers || {})[ctx.getters.storeName];

      if (worker) {
        // Store raw json objects, not the proxies
        worker.postMessage({ loadSchemas: data });
      }
    }
  },

  forgetType(state, type) {
    if ( forgetType(state, type) ) {
      delete state.inError[keyForSubscribe({ type })];
    }
  },

  reset(state) {
    resetStore(state, this.commit);
    this.commit(`${ state.config.namespace }/resetSubscriptions`);

    // Clear the podsByNamespace cache
    state.podsByNamespace = {};
  },

  loadMulti(state, { data, ctx }) {
    for (const entry of data) {
      const resource = load(state, { data: entry, ctx });

      if (resource.type === POD && resource.metadata) {
        const cache = registerNamespace(state, resource.namespace);

        addObject(cache.list, resource);
        cache.map.set(resource.id, resource);
      }
    }
  },

  remove(state, obj) {
    remove(state, obj, this.getters);

    cleanPodsByNamespaceCache(state, obj);
  }
};
