import Steve from '@/plugins/steve';
import {
  COUNT, NAMESPACE, NORMAN, MANAGEMENT, FLEET, UI, VIRTUAL_HARVESTER_PROVIDER, HCI
} from '@/config/types';
import { CLUSTER as CLUSTER_PREF, NAMESPACE_FILTERS, LAST_NAMESPACE, WORKSPACE } from '@/store/prefs';
import { allHash, allHashSettled } from '@/utils/promise';
import { ClusterNotFoundError, ApiError } from '@/utils/error';
import { sortBy } from '@/utils/sort';
import { filterBy, findBy } from '@/utils/array';
import { BOTH, CLUSTER_LEVEL, NAMESPACED } from '@/store/type-map';
import { NAME as EXPLORER } from '@/config/product/explorer';
import { TIMED_OUT, LOGGED_OUT, _FLAGGED, UPGRADED } from '@/config/query-params';
import { setBrand, setVendor } from '@/config/private-label';
import { DEFAULT_WORKSPACE } from '@/models/provisioning.cattle.io.cluster';
import { addParam } from '@/utils/url';
import { SETTING } from '@/config/settings';
import semver from 'semver';
import { NAME as VIRTUAL } from '@/config/product/harvester';
import extensions from '@/plugins/app-extension/extensions';

// Disables strict mode for all store instances to prevent warning about changing state outside of mutations
// becaues it's more efficient to do that sometimes.
export const strict = false;

export const BLANK_CLUSTER = '_';

export const plugins = [
  Steve({ namespace: 'management', baseUrl: '/v1' }),
  Steve({ namespace: 'cluster', baseUrl: '' }), // URL dynamically set for the selected cluster
  Steve({ namespace: 'rancher', baseUrl: '/v3' }),
  Steve({ namespace: 'harvester', baseUrl: '' }),
  ...extensions.createStores(),
];

export const state = () => {
  return {
    managementReady:     false,
    clusterReady:        false,
    isMultiCluster:      false,
    isRancher:           false,
    namespaceFilters:    [],
    allNamespaces:       null,
    allWorkspaces:       null,
    clusterId:           null,
    productId:           null,
    workspace:           null,
    error:               null,
    cameFromError:       false,
    pageActions:         [],
    serverVersion:       null,
  };
};

export const getters = {
  clusterReady(state) {
    return state.clusterReady === true;
  },

  isMultiCluster(state) {
    return state.isMultiCluster === true;
  },

  isRancher(state) {
    return state.isRancher === true;
  },

  clusterId(state) {
    return state.clusterId;
  },

  productId(state, getters) {
    return state.productId;
  },

  workspace(state, getters) {
    return state.workspace;
  },

  pageActions(state) {
    return state.pageActions;
  },

  currentCluster(state, getters) {
    return getters['management/byId'](MANAGEMENT.CLUSTER, state.clusterId);
  },

  currentProduct(state, getters) {
    const active = getters['type-map/activeProducts'];

    let out = findBy(active, 'name', state.productId);

    if ( !out ) {
      out = findBy(active, 'name', EXPLORER);
    }

    if ( !out ) {
      out = active[0];
    }

    return out;
  },

  currentStore(state, getters) {
    return (type) => {
      const product = getters['currentProduct'];

      if (!product) {
        return 'cluster';
      }

      if (type && product.typeStoreMap?.[type]) {
        return product.typeStoreMap[type];
      }

      return product.inStore;
    };
  },

  isExplorer(state, getters) {
    const product = getters.currentProduct;

    if ( !product ) {
      return false;
    }

    return product.name === EXPLORER || product.inStore === 'cluster';
  },

  defaultClusterId(state, getters) {
    const all = getters['management/all'](MANAGEMENT.CLUSTER);
    const clusters = sortBy(filterBy(all, 'isReady'), 'nameDisplay');

    const desired = getters['prefs/get'](CLUSTER_PREF);

    if ( clusters.find(x => x.id === desired) ) {
      return desired;
    } else if ( clusters.length ) {
      return clusters[0].id;
    }

    return BLANK_CLUSTER;
  },

  isAllNamespaces(state, getters) {
    const product = getters['currentProduct'];

    if ( !product ) {
      return true;
    }

    if ( product.showWorkspaceSwitcher ) {
      return false;
    }

    if ( !product.showNamespaceFilter && !getters['isExplorer'] ) {
      return true;
    }

    return state.namespaceFilters.filter(x => !`${ x }`.startsWith('namespaced://')).length === 0;
  },

  isMultipleNamespaces(state, getters) {
    const product = getters['currentProduct'];

    if ( !product ) {
      return true;
    }

    if ( product.showWorkspaceSwitcher ) {
      return false;
    }

    if ( getters.isAllNamespaces ) {
      return true;
    }

    const filters = state.namespaceFilters;

    if ( filters.length !== 1 ) {
      return true;
    }

    return !filters[0].startsWith('ns://');
  },

  namespaceFilters(state) {
    const filters = state.namespaceFilters.filter(x => !!x && !`${ x }`.startsWith('namespaced://'));

    return filters;
  },

  namespaceMode(state, getters) {
    const filters = state.namespaceFilters;
    const product = getters['currentProduct'];

    if ( !product?.showNamespaceFilter ) {
      return BOTH;
    }

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
      const out = {};
      const product = getters['currentProduct'];
      const workspace = state.workspace;

      if ( !product ) {
        return out;
      }

      if ( product.showWorkspaceSwitcher ) {
        return { [workspace]: true };
      }

      const inStore = product?.inStore;
      const clusterId = getters['currentCluster']?.id;

      if ( !clusterId || !inStore ) {
        return out;
      }

      const namespaces = getters[`${ inStore }/all`](NAMESPACE);
      const filters = state.namespaceFilters.filter(x => !!x && !`${ x }`.startsWith('namespaced://'));
      const includeAll = getters.isAllNamespaces;
      const includeSystem = filters.includes('all://system');
      const includeUser = filters.includes('all://user');
      const includeOrphans = filters.includes('all://orphans');

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
            const project = getters['management/byId'](MANAGEMENT.PROJECT, `${ clusterId }/${ id }`);

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
    const product = getters['currentProduct'];

    if ( !product ) {
      return 'default';
    }

    const inStore = product.inStore;
    const filteredMap = getters['namespaces']();
    const isAll = getters['isAllNamespaces'];
    const all = getters[`${ inStore }/all`](NAMESPACE).map(x => x.id);
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
  },

  backToRancherGlobalLink(state) {
    let link = '/g';

    if ( process.env.dev ) {
      link = `https://localhost:8000${ link }`;
    }

    return link;
  },

  backToRancherLink(state) {
    const clusterId = state.clusterId;

    let link = '/g';

    if ( clusterId ) {
      link = `/c/${ escape(clusterId) }`;
    }

    if ( process.env.dev ) {
      link = `https://localhost:8000${ link }`;
    }

    return link;
  },

  rancherLink(getters) {
    if ( process.env.dev ) {
      return `https://localhost:8000/`;
    }

    return '/';
  },

  isSingleVirtualCluster(state, getters, rootState, rootGetters) {
    const clusterId = getters.defaultClusterId;
    const cluster = rootGetters['management/byId'](MANAGEMENT.CLUSTER, clusterId);

    return !getters.isMultiCluster && cluster?.status?.provider === VIRTUAL_HARVESTER_PROVIDER;
  },

  isMultiVirtualCluster(state, getters, rootState, rootGetters) {
    const localCluster = rootGetters['management/byId'](MANAGEMENT.CLUSTER, 'local');

    return getters.isMultiCluster && localCluster?.status?.provider !== VIRTUAL_HARVESTER_PROVIDER;
  },

  isVirtualCluster(state, getters) {
    const cluster = getters['currentCluster'];

    return cluster?.status?.provider === VIRTUAL_HARVESTER_PROVIDER;
  }
};

export const mutations = {
  managementChanged(state, { ready, isMultiCluster, isRancher }) {
    state.managementReady = ready;
    state.isMultiCluster = isMultiCluster;
    state.isRancher = isRancher;
  },

  clusterChanged(state, ready) {
    state.clusterReady = ready;
  },

  updateNamespaces(state, { filters, all }) {
    state.namespaceFilters = filters.filter(x => !!x);

    if ( all ) {
      state.allNamespaces = all;
    }
  },

  pageActions(state, pageActions) {
    state.pageActions = pageActions;
  },

  updateWorkspace(state, { value, all }) {
    if ( all ) {
      state.allWorkspaces = all;

      if ( findBy(all, 'id', value) ) {
        // The value is a valid option, good
      } else if ( findBy(all, 'id', DEFAULT_WORKSPACE) ) {
        // How about the default
        value = DEFAULT_WORKSPACE;
      } else if ( all.length ) {
        value = all[0].id;
      }
    }

    state.workspace = value;
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
  },

  setServerVersion(state, version) {
    state.serverVersion = version;
  }
};

export const actions = {
  async loadManagement({
    getters, state, commit, dispatch
  }) {
    if ( state.managementReady) {
      // Do nothing, it's already loaded
      return;
    }

    console.log('Loading management...'); // eslint-disable-line no-console

    try {
      await dispatch('rancher/findAll', { type: NORMAN.PRINCIPAL, opt: { url: 'principals' } });
    } catch (e) {
      // Maybe not Rancher
    }

    let res = await allHashSettled({
      mgmtSubscribe:  dispatch('management/subscribe'),
      mgmtSchemas:    dispatch('management/loadSchemas', true),
      rancherSchemas: dispatch('rancher/loadSchemas', true),
    });

    const promises = {
      // Clusters guaranteed always available or your money back
      clusters: dispatch('management/findAll', {
        type: MANAGEMENT.CLUSTER,
        opt:  { url: MANAGEMENT.CLUSTER }
      }),

      // Features checks on its own if they are available
      features: dispatch('features/loadServer'),
    };

    const isRancher = res.rancherSchemas.status === 'fulfilled' && !!getters['management/schemaFor'](MANAGEMENT.PROJECT);

    if ( isRancher ) {
      promises['prefs'] = dispatch('prefs/loadServer');
      promises['rancherSubscribe'] = dispatch('rancher/subscribe');
    }

    if ( getters['management/schemaFor'](COUNT) ) {
      promises['counts'] = dispatch('management/findAll', { type: COUNT });
    }

    if ( getters['management/canList'](MANAGEMENT.SETTING) ) {
      promises['settings'] = dispatch('management/findAll', { type: MANAGEMENT.SETTING });
    }

    if ( getters['management/schemaFor'](NAMESPACE) ) {
      promises['namespaces'] = dispatch('management/findAll', { type: NAMESPACE });
    }

    const fleetSchema = getters['management/schemaFor'](FLEET.WORKSPACE);

    if (fleetSchema?.links?.collection) {
      promises['workspaces'] = dispatch('management/findAll', { type: FLEET.WORKSPACE });
    }

    res = await allHash(promises);

    let isMultiCluster = true;

    if ( res.clusters.length === 1 && res.clusters[0].metadata?.name === 'local' ) {
      isMultiCluster = false;
    }

    const pl = res.settings?.find(x => x.name === 'ui-pl')?.value;
    const brand = res.settings?.find(x => x.name === SETTING.BRAND)?.value;

    if ( pl ) {
      setVendor(pl);
    }

    if (brand) {
      setBrand(brand);
    }

    commit('managementChanged', {
      ready: true,
      isMultiCluster,
      isRancher,
    });

    if ( res.workspaces ) {
      commit('updateWorkspace', {
        value: getters['prefs/get'](WORKSPACE),
        all:   res.workspaces,
      });
    }

    console.log(`Done loading management; isRancher=${ isRancher }; isMultiCluster=${ isMultiCluster }`); // eslint-disable-line no-console
  },

  async loadCluster({
    state, commit, dispatch, getters
  }, { id, oldProduct, isExt }) {
    const isMultiCluster = getters['isMultiCluster'];
    const isRancher = getters['isRancher'];

    if ( state.clusterId && state.clusterId === id) {
      // Do nothing, we're already connected/connecting to this cluster
      return;
    }

    if (oldProduct === VIRTUAL) {
      await dispatch('harvester/unsubscribe');
      commit('harvester/reset');
    }

    if ( state.clusterId && id ) {
      // Clear the old cluster state out if switching to a new one.
      // If there is not an id then stay connected to the old one behind the scenes,
      // so that the nav and header stay the same when going to things like prefs
      commit('clusterChanged', false);

      await dispatch('cluster/unsubscribe');
      commit('cluster/reset');

      await dispatch('management/watch', {
        type:      MANAGEMENT.PROJECT,
        namespace: state.clusterId,
        stop:      true
      });

      commit('management/forgetType', MANAGEMENT.PROJECT);
      commit('catalog/reset');
    }

    if ( id ) {
      // Remember the new one
      dispatch('prefs/set', { key: CLUSTER_PREF, value: id });
      commit('setCluster', id);
    } else if ( isMultiCluster ) {
      // Switching to a global page with no cluster id, keep it the same.
      return;
    }

    console.log(`Loading ${ isMultiCluster ? 'ECM ' : '' }cluster...`); // eslint-disable-line no-console

    if (id === BLANK_CLUSTER || isExt) {
      commit('clusterChanged', true);

      return;
    }

    // Rancher `cluster` store specific, only applies to kube clusters

    // See if it really exists
    try {
      await dispatch('management/find', {
        type: MANAGEMENT.CLUSTER,
        id,
        opt:  { url: `${ MANAGEMENT.CLUSTER }s/${ escape(id) }` }
      });
    } catch {
      commit('setCluster', null);
      commit('cluster/applyConfig', { baseUrl: null });
      throw new ClusterNotFoundError(id);
    }

    const clusterBase = `/k8s/clusters/${ escape(id) }/v1`;

    // Update the Steve client URLs
    commit('cluster/applyConfig',
      { baseUrl: clusterBase });

    await Promise.all([
      dispatch('cluster/loadSchemas', true),
    ]);

    dispatch('cluster/subscribe');

    const projectArgs = {
      type: MANAGEMENT.PROJECT,
      opt:  {
        url:            `${ MANAGEMENT.PROJECT }/${ escape(id) }`,
        watchNamespace: id
      }
    };

    const res = await allHash({
      projects:          isRancher && dispatch('management/findAll', projectArgs),
      counts:            dispatch('cluster/findAll', { type: COUNT }),
      namespaces:        dispatch('cluster/findAll', { type: NAMESPACE }),
      navLinks:          !!getters['cluster/schemaFor'](UI.NAV_LINK) && dispatch('cluster/findAll', { type: UI.NAV_LINK }),
    });

    await dispatch('cleanNamespaces');

    commit('updateNamespaces', {
      filters: getters['prefs/get'](NAMESPACE_FILTERS)?.[id] || [],
      all:     res.namespaces
    });

    commit('clusterChanged', true);

    console.log('Done loading cluster.'); // eslint-disable-line no-console
  },

  switchNamespaces({ commit, dispatch, getters }, value) {
    const filters = getters['prefs/get'](NAMESPACE_FILTERS);
    const clusterId = getters['clusterId'];

    dispatch('prefs/set', {
      key:   NAMESPACE_FILTERS,
      value: {
        ...filters,
        [clusterId]: value
      }
    });
    commit('updateNamespaces', { filters: value });
  },

  async loadVirtual({
    state, commit, dispatch, getters
  }, { id, oldProduct }) {
    const isMultiCluster = getters['isMultiCluster'];

    if (isMultiCluster && id === 'local') {
      return;
    }

    if ( state.clusterId && state.clusterId === id) {
      // Do nothing, we're already connected/connecting to this cluster
      return;
    }

    if (oldProduct !== VIRTUAL) {
      await dispatch('cluster/unsubscribe');
      commit('cluster/reset');
    }

    if ( state.clusterId && id ) {
      commit('clusterChanged', false);

      await dispatch('harvester/unsubscribe');
      commit('harvester/reset');
    }

    if (id) {
      commit('setCluster', id);
    }

    console.log(`Loading ${ isMultiCluster ? 'ECM ' : '' }cluster...`); // eslint-disable-line no-console

    // See if it really exists
    const cluster = await dispatch('management/find', {
      type: MANAGEMENT.CLUSTER,
      id,
      opt:  { url: `${ MANAGEMENT.CLUSTER }s/${ escape(id) }` }
    });

    let virtualBase = `/k8s/clusters/${ escape(id) }/v1/harvester`;

    if (id === 'local') {
      virtualBase = `/v1/harvester`;
    }

    if ( !cluster ) {
      commit('setCluster', null);
      commit('harvester/applyConfig', { baseUrl: null });
      throw new ClusterNotFoundError(id);
    }

    // Update the Steve client URLs
    commit('harvester/applyConfig', { baseUrl: virtualBase });

    await Promise.all([
      dispatch('harvester/loadSchemas', true),
    ]);

    dispatch('harvester/subscribe');

    await allHash({
      virtualCount:      dispatch('harvester/findAll', { type: COUNT }),
      virtualNamespaces: dispatch('harvester/findAll', { type: NAMESPACE }),
      settings:          dispatch('harvester/findAll', { type: HCI.SETTING }),
    });

    commit('clusterChanged', true);

    console.log('Done loading virtual cluster.'); // eslint-disable-line no-console
  },

  async cleanNamespaces({ getters, dispatch }) {
    // Initialise / Remove any filters that the user no-longer has access to
    const clusters = await dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });
    const filters = getters['prefs/get'](NAMESPACE_FILTERS);

    if (!filters || !filters.length) {
      dispatch('prefs/set', {
        key:   NAMESPACE_FILTERS,
        value: { }
      });

      return;
    }

    const cleanFilters = {};

    Object.entries(filters).forEach(([clusterId, pref]) => {
      if (clusters.find(c => c.id === clusterId)) {
        cleanFilters[clusterId] = pref;
      }
    });

    if (Object.keys(filters).length !== Object.keys(cleanFilters).length) {
      console.debug('Unknown clusters have been removed from namespace filters list (before/after)', filters, cleanFilters); // eslint-disable-line no-console
      dispatch('prefs/set', {
        key:   NAMESPACE_FILTERS,
        value: cleanFilters
      });
    }
  },

  async onLogout({ dispatch, commit, state }) {
    await dispatch('management/unsubscribe');
    commit('managementChanged', { ready: false });
    commit('management/reset');
    commit('prefs/reset');

    await dispatch('cluster/unsubscribe');
    commit('clusterChanged', false);
    commit('setCluster', null);
    commit('cluster/reset');

    await dispatch('rancher/unsubscribe');
    commit('rancher/reset');
    commit('catalog/reset');

    extensions.stores().forEach(store => commit(`${ store }/reset`));

    const router = state.$router;
    const route = router.currentRoute;

    if ( route.name === 'index' ) {
      router.replace('/auth/login');
    } else {
      const QUERY = (LOGGED_OUT in route.query) ? LOGGED_OUT : TIMED_OUT;

      router.replace(`/auth/login?${ QUERY }`);
    }
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

    if ( rootState.isRancher ) {
      dispatch('rancher/rehydrateSubscribe');
    }

    dispatch('catalog/rehydrate');

    dispatch('prefs/loadCookies');
    dispatch('prefs/loadTheme');
  },

  loadingError({ commit, state }, err) {
    commit('setError', err);
    const router = state.$router;

    router.replace('/fail-whale');
  },

  updateServerVersion({ commit, state }, neu) {
    const cur = state.serverVersion;

    if ( !cur ) {
      // If we haven't heard the current version yet, this is now it.
      commit('setServerVersion', neu);

      return;
    }

    let changed = false;
    const semverCur = semver.coerce(cur);
    const semverNeu = semver.coerce(neu);

    if ( semver.valid(semverCur) && semver.valid(semverNeu) ) {
      // Regular releases have regular v2.x.y tags, reload only if it's an upgrade
      // So that we don't flap back and forth if different servers behind a LB
      //  answer with old and new versions at the same time during an upgrade

      if ( semver.lt(semverCur, semverNeu) ) {
        changed = true;
      }
    } else if ( cur !== neu ) {
      // Master and other non-releases have random names like master-head
      // or SHA-sums.  Just look if the value changed instead her
      changed = true;
    }

    if ( changed ) {
      const url = addParam(window.location.href, UPGRADED, _FLAGGED);

      window.location.replace(url);
    }
  }
};
