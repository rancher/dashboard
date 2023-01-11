import { addObject, removeObject } from '@shell/utils/array';
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
function updatePodsByNamespaceCache(state, pods, loadAll) {
  if (loadAll) {
    // Clear the entire cache - this is a fresh load
    Object.keys(state.podsByNamespace).forEach((ns) => {
      delete state.podsByNamespace[ns];
    });
  }

  // Go through all of the pods and populate cache by namespace
  pods.forEach((entry) => {
    const cache = registerNamespace(state, entry.namespace);
    const existing = cache.map.get(entry.id);

    if (existing) {
      replace(existing, entry);
    } else {
      addObject(cache.list, entry);
    }

    cache.map.set(entry.id, entry);
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
      removeObject(cache.list, cache.map.get(resource.id));
      cache.map.delete(resource.id);
    }
  } else if (resource && resource.type === NAMESPACE) {
    // Namespace deleted
    delete state.podsByNamespace[resource.namespace];
  }
}

export default {
  batchChanges(state, { ctx, batch }) {
    if (batch[POD]) {
      const newAndChangedPods = Object.entries(batch[POD]).reduce((pods, [id, pod]) => {
        // resource.remove & resource.change will already exist in store, resource.create will need classifying
        const classyResource = state.types[POD].map.get(id) || classify(ctx, pod);

        if (pod.id) {
          pods.push(classyResource);// get classified version
        } else {
          // remove empty objects (meant for remove)
          cleanPodsByNamespaceCache(state, classyResource);
        }

        return pods;
      }, []);

      updatePodsByNamespaceCache(state, newAndChangedPods, false);
    }

    if (batch[NAMESPACE]) {
      Object.entries(batch[NAMESPACE]).forEach(([id, namespace]) => {
        // resource.remove & resource.change will already exist in store, resource.create will need classifying
        const classyResource = state.types[NAMESPACE].map.get(id) || classify(ctx, namespace);

        if (!namespace.id) {
          // get classified version
          // const classyResource = state.types[NAMESPACE].list.forEach(ns => console.warn(ns.id, ns.namespace));

          cleanPodsByNamespaceCache(state, classyResource);
        }
      });
    }

    batchChanges(state, { ctx, batch });
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
      updatePodsByNamespaceCache(state, proxies, true);
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

    cleanPodsByNamespaceCache(obj);
  }
};
