import Norman from '@/plugins/norman';
import { COUNT, POD, NAMESPACE } from '@/utils/types';
import { NAMESPACES } from '@/store/prefs';

export const plugins = [
  Norman({ namespace: 'v1' })
];

export const state = () => {
  return {
    preloaded:  false,
    namespaces: [],
  };
};

export const getters = {
  allNamespaces(state) {
    return (state.namespaces || []).includes('_all');
  },

  namespaces(state) {
    return state.namespaces;
  },

  counts(state, getters) {
    const obj = getters['v1/all'](COUNT)[0].counts;
    const out = Object.keys(obj).map((id) => {
      const schema = getters['v1/schemaFor'](id);

      if ( !schema ) {
        console.log('Unknown schema, id');

        return null;
      }

      const attrs = schema.attributes || {};
      const entry = obj[id];

      return {
        id,
        label:      attrs.kind,
        group:      attrs.group,
        version:    attrs.version,
        namespaced: attrs.namespaced,
        verbs:      attrs.verbs,
        count:      entry.count,
        revision:   entry.revision
      };
    });

    return out.filter(x => !!x);
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
      dispatch('v1/loadSchemas'),
      dispatch('v1/findAll', { type: COUNT, opt: { url: 'counts' } }),
      dispatch('v1/findAll', { type: NAMESPACE, opt: { url: 'namespaces' } })
      //      dispatch('v1/findAll', { type: POD, opt: { url: 'pods' } }),
    ]);

    commit('updateNamespaces', getters['prefs/get'](NAMESPACES));
    console.log('Done Preloading.');

    commit('preloaded');
  },

  switchNamespaces({ commit }, val) {
    commit('prefs/set', { key: NAMESPACES, val });
    commit('updateNamespaces', val);
  },

  async nuxtClientInit({ state, dispatch, commit }) {
    if ( state.preloaded ) {
      commit('v1/rehydrateProxies');
    } else {
      await dispatch('preload');
    }
  },

  async nuxtServerInit({ dispatch }) {
    await dispatch('preload');
  }
};
