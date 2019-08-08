import Norman from '@/plugins/norman';

export const plugins = [
  Norman({ namespace: 'v1' })
];

export const state = () => {
  return { preloaded: false };
};

export const mutations = {
  preloaded(state) {
    state.preloaded = true;
  }
};

export const actions = {
  async preload({ state, dispatch, commit }) {
    if ( state.preloaded ) {
      return;
    }

    console.log('Preloading...');
    await Promise.all([
      dispatch('prefs/loadCookies'),
      // ctx.store.dispatch('k8s/loadAll'),
      dispatch('v1/loadSchemas'),
    ]);
    console.log('Done Preloading.');

    commit('preloaded');
  },

  nuxtClientInit({ commit }) {
    commit('v1/rehydrateProxies');
  },

  async nuxtServerInit({ dispatch }) {
    await dispatch('preload');
  }
};
