import { addObject, removeObject } from '@shell/utils/array';
import { NAMESPACE, POD, SCHEMA } from '@shell/config/types';
import {
  forgetType,
  resetStore,
  loadAll,
  load,
  remove
} from '@shell/plugins/dashboard-store/mutations';
import { keyForSubscribe } from '@shell/plugins/steve/subscribe';
import { perfLoadAll } from '@shell/plugins/steve/performanceTesting';
import Vue from 'vue';

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

export default {
  loadAll(state, {
    type,
    data,
    ctx,
    skipHaveAll
  }) {
    // Performance testing in dev and when env var is set
    if (process.env.dev && !!process.env.perfTest) {
      data = perfLoadAll(type, data);
    }

    const proxies = loadAll(state, {
      type, data, ctx, skipHaveAll
    });

    // If we loaded a set of pods, then update the podsByNamespace cache
    if (type === POD) {
      // Clear the entire cache - this is a fresh load
      Object.keys(state.podsByNamespace).forEach((ns) => {
        delete state.podsByNamespace[ns];
      });

      // Go through all of the pods and populate cache by namespace
      proxies.forEach((entry) => {
        const cache = registerNamespace(state, entry.namespace);

        addObject(cache.list, entry);
        cache.map.set(entry.id, entry);
      });
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

  clearFromQueue(state, type) {
    // Remove anything in the queue that is a resource update for the given type
    state.queue = state.queue.filter((item) => {
      return item.body?.type !== type;
    });
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

    if (obj && obj.type === POD) {
      const cache = state.podsByNamespace[obj.namespace];

      // Extra defensive check that the cache exists for the namespace being removed
      if (cache) {
        removeObject(cache.list, obj);
        cache.map.delete(obj.id);
      }
    } else if (obj && obj.type === NAMESPACE) {
      // Namespace deleted
      delete state.podsByNamespace[obj.namespace];
    }
  }
};
