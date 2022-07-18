import { addObject, removeObject } from '@shell/utils/array';
import { forgetType, resetStore, loadAll, load, remove } from '@shell/plugins/dashboard-store/mutations';
import { keyForSubscribe } from '@shell/plugins/steve/subscribe';
import { perfLoadAll } from '@shell/plugins/steve/performanceTesting';

function registerNamespace(state, namespace) {
  let cache = state.podsByNamespace[namespace];

  if (!cache) {
    cache = {
      list: [],
      map: new Map()
    };

    Vue.set(state.podsByNamespace, namespace, cache);
  }

  return cache;
}

export default {
  loadAll(state, { type, data, ctx }) {
    // Performance testing in dev and when env var is set
    if (process.env.dev && !!process.env.perfTest) {
      data = perfLoadAll(type, data);
    }

    const proxies = loadAll(state, {
      type, data, ctx
    });

    // If we loaded a set of pods, then update the posdByNamespace cache
    if (type == 'pod' && proxies?.length) {
      proxies.forEach((entry) => {
        const cache = registerNamespace(state, entry.namespace);
        addObject(cache.list, entry);
        cache.map.set(entry.id, entry);
      });
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

      if (resource.type === 'pod' && resource.metadata) {
        const cache = registerNamespace(state, resource.namespace);

        addObject(cache.list, resource);
        cache.map.set(resource.id, resource);
      }
    }
  },

  remove(state, obj) {
    remove(state, obj, this.getters);

    if (obj && obj.type === 'pod') {
      const cache = state.podsByNamespace[obj.namespace];

      removeObject(cache.list, obj);
      cache.map.delete(obj.id);
    } else if (obj && obj.type === 'namespace') {
      // Namespace deleted
      delete state.podsByNamespace[obj.namespace];
    }
  }
};
