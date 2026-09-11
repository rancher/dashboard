import gc from './gc';
import gcInterval from './gc-interval';
import gcRoute from './gc-route-changed';

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

      if (!gc.gcEnabledForStore(storeState)) {
        return;
      }

      return true;
    });
  }
};

export const gcActions = {

  gcRouteChanged(ctx, to) {
    gcRoute.gcRouteChanged(ctx, to);
  },

  gcStartIntervals(ctx) {
    gcInterval.gcStartIntervals(ctx);
  },

  gcStopIntervals(ctx) {
    gcInterval.gcStopIntervals();
  },

  gcResetStores({ dispatch, getters }) {
    getters.gcStores.forEach(([storeName, storeState]) => {
      dispatch(`${ storeName }/gcResetStore`);
    });
  },

  /**
   * Kick of a GC in all stores that support it
   */
  garbageCollect({ rootState, dispatch, getters }, ignoreTypes) {
    if (!gc.gcEnabledSetting({ rootState })) {
      return;
    }

    getters.gcStores.forEach(([storeName, storeState]) => {
      dispatch(`${ storeName }/garbageCollect`, ignoreTypes);
    });
  }
};
