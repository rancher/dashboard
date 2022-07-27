export const state = function() {
  return {
    requestData:                null,
    isTooManyItemsToAutoUpdate: false,
  };
};

export const getters = {
  isTooManyItemsToAutoUpdate: state => state.isTooManyItemsToAutoUpdate,
  requestData:                state => state.requestData
};

export const mutations = {
  updateIsTooManyItems(state, data) {
    state.isTooManyItemsToAutoUpdate = data;
  },
  updateRequestData(state, data) {
    state.requestData = data;
  },
};

export const actions = {
  clearData({ commit, state }) {
    commit('updateIsTooManyItems', false);
    commit('updateRequestData', null);
    console.log('--- CLEARING STORE DATA ---', state);
  },
  updateIsTooManyItems({ commit }, data) {
    commit('updateIsTooManyItems', data);
  },
  doManualRefresh({ commit, dispatch, state }) {
    console.log('this will fetch the data manually and store it...');

    // simple change to trigger request on mixix....
    const finalData = `${ Math.random() * 1000000 }somestring`;

    commit('updateRequestData', finalData);
  },
};
