import Norman from '@/plugins/norman';
import { COUNT, NAMESPACE, RANCHER } from '~/config/types';
import { CLUSTER as CLUSTER_PREF, NAMESPACES } from '@/store/prefs';
import SYSTEM_NAMESPACES from '@/config/system-namespaces';

export const plugins = [
  Norman({ namespace: 'cluster', baseUrl: '/k8s/clusters/local/v1' }), // @TODO cluster-specific URL
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
    const namespaces = state.namespaces;

    if ( namespaces.length ) {
      return namespaces;
    } else {
      return SYSTEM_NAMESPACES.map(x => `!${ x }`);
    }
  },

  preloaded(state) {
    return state.preloaded === true;
  },
};

export const mutations = {
  preloaded(state) {
    state.preloaded = true;
  },

  updateNamespaces(state, neu) {
    state.namespaces = neu;
  },

  updateCluster(state, neu) {
    state.cluster = neu;
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
      dispatch('rancher/findAll', { type: RANCHER.PRINCIPAL, opt: { url: 'principals' } }),
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

  switchClusters({ commit }, val) {
    commit('prefs/set', { key: CLUSTER_PREF, val });
    commit('updateCluster', val);
  },

  nuxtServerInit(ctx, nuxt) {
    // Models in SSR server mode have no way to get to the route or router, so hack one in...
    Object.defineProperty(ctx.rootState, '$router', { value: nuxt.app.router });
    Object.defineProperty(ctx.rootState, '$route', { value: nuxt.route });
  },

  nuxtClientInit() {
  },
};
