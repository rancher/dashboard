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
    console.log('Preload...');

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

  nuxtClientInit(ctx) {
    /*
    const state = ctx.state;

    if ( state && state.auth && state.auth.loggedIn ) {
      const url = `${ window.location.origin.replace(/^http(s)?:/, 'ws$1:') }/v1/subscribe`;

      debugger;
      window.$nuxt.$connect(url);
    }
    */
  },
};
