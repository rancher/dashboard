import Norman from '@/plugins/norman';
import { COUNT, NAMESPACE } from '@/utils/types';
import { NAMESPACES } from '@/store/prefs';

export const plugins = [
  Norman({ namespace: 'cluster', baseUrl: '/v1' }),
  Norman({ namespace: 'rancher', baseUrl: '/v3' })
];

export const state = () => {
  return {
    preloaded:  false,
    namespaces: [],
  };
};

export const getters = {
  multipleNamespaces(state, getters) {
    return state.namespaces.length !== 1;
  },

  namespaces(state) {
    return state.namespaces;
  },

  preloaded(state) {
    return state.preloaded === true;
  }
};

export const mutations = {
  preloaded(state) {
    state.preloaded = true;
  },

  updateNamespaces(state, neu) {
    state.namespaces = neu;
  }
};

export const actions = {
  async preload({
    state, getters, commit, dispatch
  }) {
    if ( state.preloaded ) {
      return;
    }

    console.log('Preloading...');
    await Promise.all([
      dispatch('prefs/loadCookies'),
      // ctx.store.dispatch('k8s/loadAll'),
      dispatch('cluster/loadSchemas'),
      dispatch('cluster/findAll', { type: COUNT, opt: { url: 'counts' } }),
      dispatch('cluster/findAll', { type: NAMESPACE, opt: { url: 'core.v1.namespaces' } })
      //      dispatch('cluster/findAll', { type: POD, opt: { url: 'core.v1.pods' } }),
    ]);

    commit('updateNamespaces', getters['prefs/get'](NAMESPACES));
    commit('preloaded');

    console.log('Done Preloading.');
  },

  switchNamespaces({ commit }, val) {
    commit('prefs/set', { key: NAMESPACES, val });
    commit('updateNamespaces', val);
  },

  async nuxtClientInit({ state, dispatch }) {
    if ( !state.preloaded ) {
      await dispatch('preload');
    }
  },

  async nuxtServerInit({ dispatch }) {
    await dispatch('preload');
  }
};
