export const state = function() {
  return {
    refreshFlag:                null,
    isTooManyItemsToAutoUpdate: false,
  };
};

export const getters = {
  isTooManyItemsToAutoUpdate: state => state.isTooManyItemsToAutoUpdate,
  refreshFlag:                state => state.refreshFlag
};

export const mutations = {
  updateIsTooManyItems(state, data) {
    state.isTooManyItemsToAutoUpdate = data;
  },
  updateRefreshFlag(state, data) {
    state.refreshFlag = data;
  },
};

export const actions = {
  clearData({ commit, state }) {
    commit('updateIsTooManyItems', false);
    commit('updateRefreshFlag', null);
  },
  updateIsTooManyItems({ commit }, data) {
    commit('updateIsTooManyItems', data);
  },
  doManualRefresh({ commit, dispatch, state }) {
    // simple change to trigger request on the resource-fetch mixin....
    const finalData = new Date().getTime();

    commit('updateRefreshFlag', finalData);
  },
};
