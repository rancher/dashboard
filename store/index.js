import Steve from '@/plugins/steve';
import {
  COUNT, NAMESPACE, NORMAN, EXTERNAL, MANAGEMENT, STEVE
} from '@/config/types';
import { CLUSTER as CLUSTER_PREF, NAMESPACE_FILTERS, LAST_NAMESPACE } from '@/store/prefs';
import { allHash } from '@/utils/promise';
import { ClusterNotFoundError, ApiError } from '@/utils/error';
import { sortBy } from '@/utils/sort';
import { filterBy, findBy } from '@/utils/array';
import { BOTH, CLUSTER_LEVEL, NAMESPACED } from '@/store/type-map';

// Disables strict mode for all store instances to prevent warning about changing state outside of mutations
// becaues it's more efficient to do that sometimes.
export const strict = false;

export const plugins = [
  Steve({ namespace: 'clusterExternal', baseUrl: '' }), // project scoped cluster stuff, url set later
  Steve({ namespace: 'management', baseUrl: '/v1' }),
  Steve({ namespace: 'cluster', baseUrl: '' }), // url set later
  Steve({ namespace: 'rancher', baseUrl: '/v3' }),
];

export const state = () => {
  return {
    managementReady:  false,
    clusterReady:     false,
    isRancher:        false,
    namespaceFilters: [],
    allNamespaces:    null,
    clusterId:        null,
    productId:        null,
    error:            null,
    cameFromError:    false,
  };
};

export const getters = {
  isRancher(state) {
    return state.isRancher === true;
  },

  isMultiCluster(state) {
    return state.isMultiCluster === true;
  },

  clusterId(state) {
    return state.clusterId;
  },

  productId(state, getters) {
    return state.productId;
  },

  currentCluster(state, getters) {
    return getters['management/byId'](MANAGEMENT.CLUSTER, state.clusterId) ||
      getters['management/byId'](STEVE.CLUSTER, state.clusterId);
  },

  currentProduct(state, getters) {
    return findBy(getters['type-map/activeProducts'], 'name', state.productId);
  },

  defaultClusterId(state, getters) {
    let all;

    if ( state.isRancher ) {
      all = getters['management/all'](MANAGEMENT.CLUSTER);
    } else if ( state.isMultiCluster ) {
      all = getters['management/all'](STEVE.CLUSTER);
    } else {
      return null;
    }

    const clusters = sortBy(filterBy(all, 'isReady'), 'nameDisplay');
    const desired = getters['prefs/get'](CLUSTER_PREF);

    if ( clusters.find(x => x.id === desired) ) {
      return desired;
    } else if ( clusters.length ) {
      return clusters[0].id;
    }

    return null;
  },

  isAllNamespaces(state) {
    return state.namespaceFilters.includes('all');
  },

  isMultipleNamespaces(state, getters) {
    const filters = state.namespaceFilters;

    if ( filters.length !== 1 ) {
      return true;
    }

    return !filters[0].startsWith('ns://');
  },

  namespaceMode(state) {
    const filters = state.namespaceFilters;

    // Explicitly asking
    if ( filters.includes('namespaced://true') ) {
      return NAMESPACED;
    } else if ( filters.includes('namespaced://false') ) {
      return CLUSTER_LEVEL;
    }

    const byKind = {};

    for ( const filter of filters ) {
      const type = filter.split('://', 2)[0];

      byKind[type] = (byKind[type] || 0) + 1;
    }

    if ( byKind['project'] > 0 || byKind['ns'] > 0 ) {
      return NAMESPACED;
    }

    return BOTH;
  },

  namespaces(state, getters) {
    return () => {
      const filters = state.namespaceFilters.filter(x => !x.startsWith('namespaced://'));

      const namespaces = getters['cluster/all'](NAMESPACE);

      const includeAll = filters.includes('all');
      const includeSystem = filters.includes('all://system');
      const includeUser = filters.includes('all://user') || filters.length === 0;
      const includeOrphans = filters.includes('all://orphans');
      const out = {};

      // Special cases to pull in all the user, system, or orphaned namespaces
      if ( includeAll || includeOrphans || includeSystem || includeUser ) {
        for ( const ns of namespaces ) {
          if (
            includeAll ||
            ( includeOrphans && !ns.projectId ) ||
            ( includeUser && !ns.isSystem ) ||
            ( includeSystem && ns.isSystem )
          ) {
            out[ns.id] = true;
          }
        }
      }

      // Individual requests for a specific project/namespace
      if ( !includeAll ) {
        for ( const filter of filters ) {
          const [type, id] = filter.split('://', 2);

          if ( !type ) {
            continue;
          }

          if ( type === 'ns' ) {
            out[id] = true;
          } else if ( type === 'project' ) {
            const project = getters['clusterExternal/byId'](EXTERNAL.PROJECT, id);

            if ( project ) {
              for ( const ns of project.namespaces ) {
                out[ns.id] = true;
              }
            }
          }
        }
      }

      return out;
    };
  },

  defaultNamespace(state, getters, rootState, rootGetters) {
    const filteredMap = getters['namespaces']();
    const isAll = getters['isAllNamespaces'];
    const all = getters['cluster/all'](NAMESPACE).map(x => x.id);
    let out;

    function isOk() {
      if ( !out ) {
        return false;
      }

      return (isAll && all.includes(out) ) ||
             (!isAll && filteredMap && filteredMap[out] );
    }

    out = rootGetters['prefs/get'](LAST_NAMESPACE);
    if ( isOk() ) {
      return out;
    }

    out = 'default';
    if ( isOk() ) {
      return out;
    }

    if ( !isAll ) {
      const keys = Object.keys(filteredMap);

      if ( keys.length ) {
        return keys[0];
      }
    }

    return all[0];
  }
};

export const mutations = {
  managementChanged(state, { ready, isRancher, isMultiCluster }) {
    state.managementReady = ready;
    state.isRancher = isRancher;
    state.isMultiCluster = isMultiCluster;
  },

  clusterChanged(state, ready) {
    state.clusterReady = ready;
  },

  updateNamespaces(state, { filters, all }) {
    state.namespaceFilters = filters;

    if ( all ) {
      state.allNamespaces = all;
    }
  },

  setCluster(state, neu) {
    state.clusterId = neu;
  },

  setProduct(state, neu) {
    state.productId = neu;
  },

  setError(state, obj) {
    const err = new ApiError(obj);

    console.log('Loading error', err); // eslint-disable-line no-console

    state.error = err;
    state.cameFromError = true;
  },

  cameFromError(state) {
    state.cameFromError = true;
  }
};

export const actions = {
  async loadManagement({
    getters, state, commit, dispatch
  }) {
    if ( state.managementReady ) {
      // Do nothing, it's already loaded
      return;
    }

    console.log('Loading management...'); // eslint-disable-line no-console

    try {
      await Promise.all([
        dispatch('rancher/findAll', { type: NORMAN.PRINCIPAL, opt: { url: 'principals' } }),
        dispatch('rancher/loadSchemas')
      ]);
    } catch (e) {
      // Maybe not Rancher
    }

    await allHash({
      prefs:      dispatch('prefs/loadServer'),
      schemas: Promise.all([
        dispatch('management/subscribe'),
        dispatch('management/loadSchemas', true),
      ]),
    });

    // await dispatch('management/findAll', { type: COUNT, opt: { url: 'counts' } });

    let isRancher = false;
    let isMultiCluster = false;
    const promises = [];

    if ( getters['management/schemaFor'](STEVE.CLUSTER) ) {
      isMultiCluster = true;
      promises.push(dispatch('management/findAll', {
        type: STEVE.CLUSTER,
        opt:  { url: `${ STEVE.CLUSTER }s` }
      }));
    }

    if ( getters['management/schemaFor'](MANAGEMENT.CLUSTER) ) {
      isRancher = true;
      isMultiCluster = true;

      promises.push(dispatch('management/findAll', {
        type: MANAGEMENT.CLUSTER,
        opt:  { url: `${ MANAGEMENT.CLUSTER }s` }
      }));
    }

    await Promise.all(promises);

    commit('managementChanged', {
      ready: true,
      isRancher,
      isMultiCluster
    });

    console.log(`Done loading management; isRancher=${ isRancher }, isMultiCluster=${ isMultiCluster }`); // eslint-disable-line no-console
  },

  async loadCluster({
    state, commit, dispatch, getters
  }, id) {
    let cluster, clusterBase, externalBase;
    const isRancher = getters['isRancher'];
    const isMultiCluster = getters['isMultiCluster'];

    if ( state.clusterReady && state.clusterId && state.clusterId === id ) {
      // Do nothing, we're already connected to this cluster
      return;
    }

    if ( state.clusterId && id ) {
      // Clear the old cluster state out if switching to a new one.
      // If there is not an id then stay connected to the old one behind the scenes,
      // so that the nav and header stay the same when going to things like prefs
      await dispatch('cluster/unsubscribe');
      await dispatch('clusterExternal/unsubscribe');
      commit('cluster/forgetAll');
      commit('clusterExternal/forgetAll');
      commit('clusterChanged', false);
    }

    if ( id ) {
      // Remember the new one
      dispatch('prefs/set', { key: CLUSTER_PREF, value: id });
      commit('setCluster', id);
    } else if ( isRancher ) {
      // Switching to a global page with no cluster id, keep it the same.
      return;
    }

    console.log(`Loading ${ isRancher ? 'Rancher ' : '' }cluster...`); // eslint-disable-line no-console

    if ( isRancher ) {
      // See if it really exists
      cluster = await dispatch('management/find', {
        type: MANAGEMENT.CLUSTER,
        id,
        opt:  { url: `${ MANAGEMENT.CLUSTER }s/${ escape(id) }` }
      });

      clusterBase = `/k8s/clusters/${ escape(id) }/v1`;
      externalBase = `/v1/management.cattle.io.clusters/${ escape(id) }`;
    } else if ( isMultiCluster ) {
      // See if it really exists
      cluster = await dispatch('management/find', {
        type: STEVE.CLUSTER,
        id,
        opt:  { url: `${ STEVE.CLUSTER }s/${ escape(id) }` }
      });

      clusterBase = `/k8s/clusters/${ escape(id) }/v1`;
      externalBase = null;
    } else {
      cluster = getters['management/byId'](MANAGEMENT.CLUSTER, 'local');

      if ( !cluster ) {
        // Make a fake cluster schema and push it into the store
        await dispatch('management/load', {
          data: {
            id:   STEVE.CLUSTER,
            type: 'schema',
          }
        });

        // Make a fake cluster and push it into the store
        cluster = await dispatch('management/load', {
          data: {
            id:         'local',
            type:       STEVE.CLUSTER,
            links:      { self: '' },
            metadata:   { name: 'local' },
            status:   {
              conditions: [{
                type:   'Ready',
                status: 'True'
              }],
            }
          }
        });
      }

      commit('setCluster', cluster.id);

      clusterBase = '/v1';
      externalBase = null;
    }

    if ( !cluster ) {
      commit('setCluster', null);
      commit('cluster/applyConfig', { baseUrl: null });
      commit('clusterExternal/applyConfig', { baseUrl: null });
      throw new ClusterNotFoundError(id);
    }

    // Update the Steve client URLs
    commit('cluster/applyConfig', { baseUrl: clusterBase });
    isRancher && commit('clusterExternal/applyConfig', { baseUrl: externalBase });

    await Promise.all([
      dispatch('cluster/loadSchemas', true),
      isRancher && dispatch('clusterExternal/loadSchemas', false),
    ]);

    dispatch('cluster/subscribe');
    isRancher && dispatch('clusterExternal/subscribe');

    const res = await allHash({
      projects:   isRancher && dispatch('clusterExternal/findAll', { type: EXTERNAL.PROJECT, opt: { url: 'projects' } }),
      counts:     dispatch('cluster/findAll', { type: COUNT, opt: { url: 'counts' } }),
      namespaces: dispatch('cluster/findAll', { type: NAMESPACE, opt: { url: 'namespaces' } })
    });

    commit('updateNamespaces', {
      filters: getters['prefs/get'](NAMESPACE_FILTERS),
      all:     res.namespaces
    });

    commit('clusterChanged', true);

    console.log('Done loading cluster.'); // eslint-disable-line no-console
  },

  switchNamespaces({ commit, dispatch }, value) {
    dispatch('prefs/set', { key: NAMESPACE_FILTERS, value });
    commit('updateNamespaces', { filters: value });
  },

  async onLogout({ dispatch, commit }) {
    await dispatch('management/unsubscribe');
    commit('managementChanged', { ready: false });
    commit('management/forgetAll');

    await dispatch('cluster/unsubscribe');
    commit('clusterChanged', false);
    commit('cluster/forgetAll');

    await dispatch('clusterExternal/unsubscribe');
    commit('clusterExternal/forgetAll');

    commit('rancher/forgetAll');
  },

  nuxtServerInit({ dispatch, rootState }, nuxt) {
    // Models in SSR server mode have no way to get to the route or router, so hack one in...
    Object.defineProperty(rootState, '$router', { value: nuxt.app.router });
    Object.defineProperty(rootState, '$route', { value: nuxt.route });
    dispatch('prefs/loadCookies');
  },

  nuxtClientInit({ dispatch, rootState }, nuxt) {
    Object.defineProperty(rootState, '$router', { value: nuxt.app.router });
    Object.defineProperty(rootState, '$route', { value: nuxt.route });
    dispatch('management/rehydrateSubscribe');
    dispatch('cluster/rehydrateSubscribe');
    dispatch('prefs/loadCookies');
    dispatch('prefs/loadTheme');
  },

  loadingError({ commit, redirect }, err) {
    commit('setError', err);
    redirect('/fail-whale');
  }
};
