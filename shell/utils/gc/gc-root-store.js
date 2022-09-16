import {
  gcEnabledForStore, gcEnabledSetting, GC_INTERVAL, GC_RUN_ON_INTERVAL, GC_RUN_ON_ROUTE_CHANGE
} from '@shell/utils/gc/gc-utils';

let gcInterval = null;

function getResourceFromRoute(to) {
  let resource = to.params?.resource;

  if ( !resource ) {
    const match = to.name?.match(/^c-cluster-([^-]+)/);

    if ( match ) {
      resource = match[2];
    }
  }

  return resource;
}

export const gcGetters = {
  /**
   * Fetch all stores that support garbage collection
   */
  gcStores(state) {
    // It would be nice to grab all vuex module stores that we've registered, apparently this is only possible via the
    // internal properties store._modules.root._children.
    // So instead loop through all state entries to find the gc stores
    return Object.entries(state).filter(([storeName, storeState]) => {
      if (typeof (storeState) !== 'object') {
        return;
      }

      if (!gcEnabledForStore(storeState)) {
        return;
      }

      return true;
    });
  }
};

export const gcMutations = {
  gcRouteChanged(state) {
    state.gcRouteChanged = new Date().getTime();
  },
};

export const gcActions = {
  /**
   * A logged in route has changed
   * 1) Track the time this occurred to ensure any resources fetched afterwards are not GCd
   * 2) Kick off a GC
   */
  gcRouteChanged({ dispatch, commit, rootState }, to) {
    commit(`gcRouteChanged`);

    if (!gcEnabledSetting({ rootState }) || !GC_RUN_ON_ROUTE_CHANGE || to.name === 'auth-logout') {
      // Convenience, no point GC'ing if we've just lost all types
      console.warn('root gcRouteChanged', 'IGNORING (disabled)');// TODO: RC LOG

      return;
    }

    const resource = getResourceFromRoute(to);
    const ignoreTYpes = !!resource ? { [resource]: true } : {};

    console.warn('resource from route:', resource, to); // TODO: RC LOG

    dispatch('garbageCollect', ignoreTYpes);
  },

  /**
   * Request we start garbage collection at regular intervals
   *
   * If GC is disabled or running return early
   */
  gcStartIntervals({ dispatch, rootState }) {
    if (!gcEnabledSetting({ rootState }) || !GC_RUN_ON_INTERVAL) {
      console.warn('root gcStartIntervals', 'IGNORING (disabled)');// TODO: RC LOG

      return;
    }

    if (gcInterval) {
      return;
    }
    console.warn('root gcStartIntervals', 'start'); // TODO: RC LOG

    gcInterval = setInterval(() => {
      dispatch('garbageCollect');
    }, GC_INTERVAL);
  },

  gcStopIntervals() {
    console.warn('root gcStartIntervals', 'stpp'); // TODO: RC LOG
    clearInterval(gcInterval);
  },

  gcReset({ dispatch, getters }) {
    getters.gcStores.forEach(([storeName, storeState]) => {
      console.warn('root gcReset', '', storeName); // TODO: RC LOG

      dispatch(`${ storeName }/gcReset`);
    });
  },

  /**
   * Kick of a GC in all stores that support it
   */
  garbageCollect({ rootState, dispatch, getters }, ignoreTypes) {
    if (!gcEnabledSetting({ rootState })) {
      console.warn('root garbageCollect', 'IGNORING (disabled)');// TODO: RC LOG

      return;
    }

    getters.gcStores.forEach(([storeName, storeState]) => {
      console.warn('root garbageCollect', '', storeName);// TODO: RC LOG

      dispatch(`${ storeName }/garbageCollect`, ignoreTypes);
    });
  }
};
