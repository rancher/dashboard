export const state = function() {
  return {
    refreshData: {
      resourceName:               null,
      inStore:                    null,
      isTooManyItemsToAutoUpdate: false,
    },
    requestData: null
  };
};

export const getters = {
  isTooManyItemsToAutoUpdate: state => state.refreshData.isTooManyItemsToAutoUpdate,
  requestData:                state => state.requestData,
};

export const mutations = {
  updateRefreshData(state, data) {
    state.refreshData = data;
  },
  updateRequestData(state, data) {
    state.requestData = data;
  },
};

export const actions = {
  updateRefreshData({ commit }, data) {
    commit('updateRefreshData', data);
  },
  async doManualRefresh({ commit, dispatch, state }) {
    console.log('this will fetch the data manually and store it...');

    const data = await dispatch(`${ state.refreshData.inStore }/findAll`, {
      type: state.refreshData.resourceName,
      opt:  { watch: false, force: true }
    }, { root: true });

    commit('updateRequestData', data);
  },
};
