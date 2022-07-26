export const state = function() {
  return {
    refreshData:                [],
    requestData:                null,
    isTooManyItemsToAutoUpdate: false,
    isManualDataLoading:        false
  };
};

export const getters = {
  isTooManyItemsToAutoUpdate: state => state.isTooManyItemsToAutoUpdate,
  requestData:                state => state.requestData,
  isManualDataLoading:        state => state.isManualDataLoading,
};

export const mutations = {
  updateRefreshData(state, data) {
    state.refreshData = data.refreshData;
  },
  updateIsTooManyItems(state, data) {
    state.isTooManyItemsToAutoUpdate = data.isTooManyItemsToAutoUpdate;
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
    commit('updateIsTooManyItems', data);
  },
  clearData({ commit }, data) {
    commit('updateRefreshData', []);
    commit('updateRequestData', null);
    commit('updateIsTooManyItems', false);
  },
  async doManualRefresh({ commit, dispatch, state }) {
    console.log('this will fetch the data manually and store it...');
    commit('updateIsManualDataLoading', true);

    const promises = [];

    // do all requests to API
    state.refreshData.forEach((data) => {
      promises.push(dispatch(`${ data.inStore }/findAll`, {
        type: data.resourceName,
        opt:  { watch: false, force: true }
      }, { root: true }));
    });

    const response = await Promise.allSettled(promises);

    // this map is adding the dataKey properly via index
    const data = response.map((res, i) => {
      return {
        ...res,
        dataKey: state.refreshData[i].dataKey
      };
    });

    // hack to check on vuex if data is properly mutated on the store. To be deleted
    data[0].value[0].stuff = 'blabla;';

    // final data formatting before updating store
    const finalData = [];

    data.forEach((item) => {
      if (item.status === 'fulfilled') {
        finalData.push({
          value:   item.value,
          dataKey: item.dataKey
        });
      }
    });

    commit('updateIsManualDataLoading', false);
    commit('updateRequestData', finalData);
  },
};
