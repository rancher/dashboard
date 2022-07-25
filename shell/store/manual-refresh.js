export const state = function() {
  return {
    refreshData: {
      resourceName:               null,
      inStore:                    null,
      isTooManyItemsToAutoUpdate: false,
    },
    requestData:         null,
    isManualDataLoading: false
  };
};

export const getters = {
  isTooManyItemsToAutoUpdate: state => state.refreshData.isTooManyItemsToAutoUpdate,
  requestData:                state => state.requestData,
  isManualDataLoading:        state => state.isManualDataLoading,
};

export const mutations = {
  updateRefreshData(state, data) {
    state.refreshData = data;
  },
  updateRequestData(state, data) {
    state.requestData = data;
  },
  updateIsManualDataLoading(state, val) {
    state.isManualDataLoading = val;
  },
};

export const actions = {
  updateRefreshData({ commit }, data) {
    commit('updateRefreshData', data);
  },
  async doManualRefresh({ commit, dispatch, state }) {
    console.log('this will fetch the data manually and store it...');
    commit('updateIsManualDataLoading', true);

    const data = await dispatch(`${ state.refreshData.inStore }/findAll`, {
      type: state.refreshData.resourceName,
      opt:  { watch: false, force: true }
    }, { root: true });

    commit('updateIsManualDataLoading', false);
    commit('updateRequestData', data);
  },
};
