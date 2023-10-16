import { BACK_TO } from '@shell/config/local-storage';
import { setBrand, setVendor } from '@shell/config/private-label';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { LOGGED_OUT, TIMED_OUT, UPGRADED, _FLAGGED } from '@shell/config/query-params';
import { SETTING } from '@shell/config/settings';
import {
  COUNT,
  DEFAULT_WORKSPACE,
  FLEET,
  MANAGEMENT,
  NAMESPACE, NORMAN,
  UI, VIRTUAL_HARVESTER_PROVIDER, HCI
} from '@shell/config/types';
import { BY_TYPE } from '@shell/plugins/dashboard-store/classify';
import Steve from '@shell/plugins/steve';
import { STEVE_MODEL_TYPES } from '@shell/plugins/steve/getters';
import { CLUSTER as CLUSTER_PREF, LAST_NAMESPACE, NAMESPACE_FILTERS, WORKSPACE } from '@shell/store/prefs';
import { BOTH, CLUSTER_LEVEL, NAMESPACED } from '@shell/store/type-map';
import { filterBy, findBy } from '@shell/utils/array';
import { ApiError, ClusterNotFoundError } from '@shell/utils/error';
import { gcActions, gcGetters } from '@shell/utils/gc/gc-root-store';
import {
  NAMESPACE_FILTER_ALL_ORPHANS as ALL_ORPHANS,
  NAMESPACE_FILTER_ALL_SYSTEM as ALL_SYSTEM,
  NAMESPACE_FILTER_ALL_USER as ALL_USER,
  NAMESPACE_FILTER_NAMESPACED_NO as NAMESPACED_NO,
  NAMESPACE_FILTER_NAMESPACED_PREFIX as NAMESPACED_PREFIX,
  NAMESPACE_FILTER_NAMESPACED_YES as NAMESPACED_YES,
  splitNamespaceFilterKey,
  NAMESPACE_FILTER_NS_FULL_PREFIX,
} from '@shell/utils/namespace-filter';
import { allHash, allHashSettled } from '@shell/utils/promise';
import { sortBy } from '@shell/utils/sort';
import { addParam } from '@shell/utils/url';
import semver from 'semver';
import { STORE, BLANK_CLUSTER } from '@shell/store/store-types';
import { isDevBuild } from '@shell/utils/version';

// Disables strict mode for all store instances to prevent warning about changing state outside of mutations
// because it's more efficient to do that sometimes.
export const strict = false;

export const plugins = [
  Steve({
    namespace:      STORE.MANAGEMENT,
    baseUrl:        '/v1',
    modelBaseClass: BY_TYPE,
    supportsStream: false, // true, -- Disabled due to report that it's sometimes much slower in Chrome
  }),
  Steve({
    namespace:      STORE.CLUSTER,
    baseUrl:        '', // URL is dynamically set for the selected cluster
    supportsStream: false, // true, -- Disabled due to report that it's sometimes much slower in Chrome
    supportsGc:     true, // Enable garbage collection for this store only
  }),
  Steve({
    namespace:      STORE.RANCHER,
    baseUrl:        '/v3',
    supportsStream: false, // The norman API doesn't support streaming
    modelBaseClass: STEVE_MODEL_TYPES.NORMAN,
  }),
];

/**
 * Get all the namespaces categories
 * @returns Record<string, true>
 */
const getActiveNamespacesCategories = (getters, namespaces, filters) => {
  // Split namespaces by category
  const includeAll = getters.isAllNamespaces;
  const includeSystem = filters.includes(ALL_SYSTEM);
  const includeUser = filters.includes(ALL_USER);
  const includeOrphans = filters.includes(ALL_ORPHANS);

  // Categories to pull in all the user, system, or orphaned namespaces
  const hasCategory = includeAll || includeOrphans || includeSystem || includeUser;

  return hasCategory ? Object.values(namespaces).reduce((acc, ns) => {
    if (
      includeAll ||
      (includeOrphans && !ns.projectId) ||
      (includeUser && !ns.isSystem) ||
      (includeSystem && ns.isSystem)
    ) {
      acc[ns.id] = true;
    }

    return acc;
  }, {}) : {};
};

/**
 * Get handpicked namespaces from the filters
 * @returns Record<string, true>
 */
const getActiveSingleNamespaces = (getters, filters) => {
  const activeNamespaces = {};

  // Individual cases for stacked project and/or namespace filters
  if ( !getters.isAllNamespaces ) {
    const clusterId = getters['currentCluster']?.id;

    for ( const filter of filters ) {
      const [type, id] = filter.split('://', 2);

      if ( !type ) {
        continue;
      }

      if ( type === 'ns' ) {
        activeNamespaces[id] = true;
      } else if (type === 'project') {
        // Set all the namespaces contained in the project
        const project = getters['management/byId'](MANAGEMENT.PROJECT, `${ clusterId }/${ id }`);

        if ( project ) {
          for ( const projectNamespace of project.namespaces ) {
            activeNamespaces[projectNamespace.id] = true;
          }
        }
      }
    }
  }

  return activeNamespaces;
};

/**
 * Get only namespaces for user with roles "Cluster Member" and "View All Projects"
 * @returns Record<string, true>
 */
const getReadOnlyActiveNamespaces = (namespaces, activeNamespaces) => {
  const readonlyNamespaces = Object
    .values(namespaces)
    .filter((ns) => !!ns.links.update)
    .map(({ id }) => id);

  return Object.keys(activeNamespaces)
    .filter((ns) => readonlyNamespaces.includes(ns))
    .reduce((acc, ns) => ({
      ...acc,
      [ns]: true
    }), {});
};

/**
 * Collect all the namespaces grouped by category, project or single pick
 * @returns Record<string, true>
 */
const getActiveNamespaces = (state, getters, readonly = false) => {
  const product = getters['currentProduct'];

  if ( !product ) {
    return {};
  }

  // TODO: Add comment with logic for fleet
  if ( product.showWorkspaceSwitcher ) {
    const fleetOut = { [state.workspace]: true };

    updateActiveNamespaceCache(state, fleetOut);

    return fleetOut;
  }

  // Reset cache if no cluster is found or is not in store
  const inStore = product?.inStore;
  const clusterId = getters['currentCluster']?.id;

  if ( !clusterId || !inStore ) {
    updateActiveNamespaceCache(state, {});

    return {};
  }

  // Use default "All Namespaces" category if no namespaces is found
  const hasNamespaces = Array.isArray(state.allNamespaces) && state.allNamespaces.length > 0;
  const allNamespaces = hasNamespaces ? state.allNamespaces : getters[`${ inStore }/all`](NAMESPACE);

  const allowedNamespaces = allNamespaces
    .filter((ns) => state.prefs.data['all-namespaces'] ? true : !ns.isObscure) // Filter out Rancher system namespaces
    .filter((ns) => product.hideSystemResources ? !ns.isSystem : true); // Filter out Fleet system namespaces

  // Retrieve all the filters selected by the user
  const filters = state.namespaceFilters.filter(
    (filters) => !!filters && !`${ filters }`.startsWith(NAMESPACED_PREFIX)
  );

  const activeNamespaces = {
    ...getActiveNamespacesCategories(getters, allowedNamespaces, filters),
    ...getActiveSingleNamespaces(getters, filters),
  };

  // Create map that can be used to efficiently check if a resource should be displayed
  updateActiveNamespaceCache(state, activeNamespaces);

  // Exclude namespaces restricted to the user for writing
  if (readonly) {
    return getReadOnlyActiveNamespaces(allowedNamespaces, activeNamespaces);
  }

  return activeNamespaces;
};

/**
 * Caching side-effect while retrieving namespaces filters
 */
const updateActiveNamespaceCache = (state, activeNamespaceCache) => {
  // This is going to run a lot, so keep it optimised
  let cacheKey = '';

  for (const key in activeNamespaceCache) {
    // I thought array.join would be faster than string concatenation, but in places like this where the array must first be constructed it's
    // slower.
    cacheKey += key + activeNamespaceCache[key];
  }

  // Only update `activeNamespaceCache` if there have been changes. This reduces a lot of churn
  if (state.activeNamespaceCacheKey !== cacheKey) {
    state.activeNamespaceCacheKey = cacheKey;
    state.activeNamespaceCache = activeNamespaceCache;
  }
};

export const state = () => {
  return {
    managementReady:         false,
    clusterReady:            false,
    isRancher:               false,
    namespaceFilters:        [],
    activeNamespaceCache:    {}, // Used to efficiently check if a resource should be displayed
    activeNamespaceCacheKey: '', // Fingerprint of activeNamespaceCache
    allNamespaces:           [],
    allWorkspaces:           [],
    clusterId:               null,
    productId:               null,
    workspace:               null,
    error:                   null,
    cameFromError:           false,
    pageActions:             [],
    serverVersion:           null,
    systemNamespaces:        [],
    isSingleProduct:         undefined,
    isRancherInHarvester:    false,
    targetRoute:             null
  };
};

export const getters = {
  clusterReady(state) {
    return state.clusterReady === true;
  },

  isMultiCluster(state, getters) {
    const clusters = getters['management/all'](MANAGEMENT.CLUSTER);

    if (clusters.length === 1 && clusters[0].metadata?.name === 'local') {
      return false;
    } else {
      return true;
    }
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

  systemNamespaces(state) {
    return state.systemNamespaces;
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

  getStoreNameByProductId(state) {
    const products = state['type-map']?.products;

    return (products.find((p) => p.name === state.productId) || {})?.inStore || 'cluster';
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

    if ( clusters.find((x) => x.id === desired) ) {
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

    return state.namespaceFilters.filter((x) => !`${ x }`.startsWith(NAMESPACED_PREFIX)).length === 0;
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

    return !filters[0].startsWith(NAMESPACE_FILTER_NS_FULL_PREFIX);
  },

  namespaceFilters(state) {
    const filters = state.namespaceFilters.filter((x) => !!x && !`${ x }`.startsWith(NAMESPACED_PREFIX));

    return filters;
  },

  namespaceMode(state, getters) {
    const filters = state.namespaceFilters;
    const product = getters['currentProduct'];

    if ( !product?.showNamespaceFilter ) {
      return BOTH;
    }

    // Explicitly asking
    if ( filters.includes(NAMESPACED_YES) ) {
      return NAMESPACED;
    } else if ( filters.includes(NAMESPACED_NO) ) {
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

  activeNamespaceCache(state) {
    // The activeNamespaceCache value is updated by the
    // updateNamespaces mutation. We use this map to filter workloads
    // as we don't want to recompute the active namespaces
    // for each workload in a list.
    return state.activeNamespaceCache;
  },

  activeNamespaceCacheKey(state) {
    return state.activeNamespaceCacheKey;
  },

  activeNamespaceFilters(state) {
    return state.namespaceFilters;
  },

  allNamespaces(state) {
    return state.allNamespaces;
  },

  namespaces(state, getters) {
    // Call this getter if you want to recompute the active namespaces
    // by looping over all namespaces in a cluster. Otherwise call activeNamespaceCache,
    // which returns the same object but is only recomputed when the updateNamespaces
    // mutation is called.
    return () => getActiveNamespaces(state, getters);
  },

  /**
   * Return namespaces which the user can refer to create resources
   * @returns Record<string, true>
   */
  allowedNamespaces(state, getters) {
    return () => getActiveNamespaces(state, getters, true);
  },

  defaultNamespace(state, getters, rootState, rootGetters) {
    const product = getters['currentProduct'];

    if ( !product ) {
      return 'default';
    }

    const inStore = product.inStore;
    const filteredMap = getters['activeNamespaceCache'];
    const isAll = getters['isAllNamespaces'];
    const all = getters[`${ inStore }/all`](NAMESPACE).map((x) => x.id);
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

  isSingleProduct(state) {
    if (state.isSingleProduct !== undefined) {
      return state.isSingleProduct;
    }

    return false;
  },

  isRancherInHarvester(state) {
    return state.isRancherInHarvester;
  },

  isVirtualCluster(state, getters) {
    const cluster = getters['currentCluster'];

    return cluster?.status?.provider === VIRTUAL_HARVESTER_PROVIDER;
  },

  isStandaloneHarvester(state, getters) {
    const clusters = getters['management/all'](MANAGEMENT.CLUSTER);
    const cluster = clusters.find((c) => c.id === 'local') || {};

    return getters['isSingleProduct'] && cluster.isHarvester && !getters['isRancherInHarvester'];
  },

  showTopLevelMenu(getters) {
    return getters['isRancherInHarvester'] || getters['isMultiCluster'] || !getters['isSingleProduct'];
  },

  targetRoute(state) {
    return state.targetRoute;
  },

  releaseNotesUrl(state, getters) {
    const version = getters['management/byId'](MANAGEMENT.SETTING, 'server-version')?.value;

    const base = 'https://github.com/rancher/rancher/releases';

    if (version && !isDevBuild(version)) {
      return `${ base }/tag/${ version }`;
    }

    return `${ base }/latest`;
  },

  ...gcGetters
};

export const mutations = {
  managementChanged(state, { ready, isRancher }) {
    state.managementReady = ready;
    state.isRancher = isRancher;
  },
  clusterReady(state, ready) {
    state.clusterReady = ready;
  },

  isRancherInHarvester(state, neu) {
    state.isRancherInHarvester = neu;
  },

  updateNamespaces(state, { filters, all }) {
    state.namespaceFilters = filters.filter((x) => !!x);

    if ( all ) {
      state.allNamespaces = all;
    }
    // Create map that can be used to efficiently check if a
    // resource should be displayed
    getActiveNamespaces(state, getters);
  },

  changeAllNamespaces(state, namespace) {
    // `allNamespaces/changeAllNamespaces` allow products to restrict the namespaces shown to the user in the NamespaceFilter and NameNsDescription components.
    // You can configure the `notFilterNamespace` parameter for each resource page to define namespaces that do not need to be filtered,  and then change `allNamespaces` by calling `changeAllNamespaces`
    // eg:
    // const notFilterNamespaces = this.$store.getters[`type-map/optionsFor`](resource).notFilterNamespace || [];
    // const allNamespaces = this.$store.getters[`${ this.currentProduct.inStore }/filterNamespace`](notFilterNamespaces);
    state.allNamespaces = namespace;
  },

  pageActions(state, pageActions) {
    state.pageActions = pageActions;
  },

  updateWorkspace(state, { value, all, getters }) {
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
    getActiveNamespaces(state, getters);
  },

  clusterId(state, neu) {
    state.clusterId = neu;
  },

  setProduct(state, neu) {
    state.productId = neu;
  },

  setError(state, { error: obj, locationError }) {
    const err = new ApiError(obj);

    console.log('Loading error', err); // eslint-disable-line no-console
    console.log('(actual error)', obj); // eslint-disable-line no-console
    // Location of error, with description and stack trace
    console.log('Loading error location', locationError); // eslint-disable-line no-console
    console.log('Loading original error', obj); // eslint-disable-line no-console

    state.error = err;
    state.cameFromError = true;
  },

  cameFromError(state) {
    state.cameFromError = true;
  },

  setServerVersion(state, version) {
    state.serverVersion = version;
  },

  setSystemNamespaces(state, namespaces) {
    state.systemNamespaces = namespaces;
  },

  setIsSingleProduct(state, isSingleProduct) {
    state.isSingleProduct = isSingleProduct;
  },

  targetRoute(state, route) {
    state.targetRoute = route;
  }
};

export const actions = {
  async loadManagement({
    getters, state, commit, dispatch, rootGetters
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
    dispatch('i18n/init');
    const isMultiCluster = getters['isMultiCluster'];

    // If the local cluster is a Harvester cluster and 'rancher-manager-support' is true, it means that the embedded Rancher is being used.
    const localCluster = res.clusters?.find((c) => c.id === 'local');

    if (localCluster?.isHarvester) {
      const harvesterSetting = await dispatch('cluster/findAll', { type: HCI.SETTING, opt: { url: `/v1/harvester/${ HCI.SETTING }s` } });
      const rancherManagerSupport = harvesterSetting.find((setting) => setting.id === 'rancher-manager-support');
      const isRancherInHarvester = (rancherManagerSupport?.value || rancherManagerSupport?.default) === 'true';

      commit('isRancherInHarvester', isRancherInHarvester);
    }

    const pl = res.settings?.find((x) => x.id === 'ui-pl')?.value;
    const brand = res.settings?.find((x) => x.id === SETTING.BRAND)?.value;
    const systemNamespaces = res.settings?.find((x) => x.id === SETTING.SYSTEM_NAMESPACES);

    if ( pl ) {
      setVendor(pl);
    }

    if (brand) {
      setBrand(brand);
    }

    if (systemNamespaces) {
      const namespace = (systemNamespaces.value || systemNamespaces.default)?.split(',');

      commit('setSystemNamespaces', namespace);
    }

    commit('managementChanged', {
      ready: true,
      isRancher,
    });

    if ( res.workspaces ) {
      commit('updateWorkspace', {
        value: getters['prefs/get'](WORKSPACE),
        all:   res.workspaces,
        getters
      });
    }

    console.log(`Done loading management; isRancher=${ isRancher }; isMultiCluster=${ isMultiCluster }`); // eslint-disable-line no-console
  },

  async loadCluster({
    state, commit, dispatch, getters
  }, {
    id, product, oldProduct, oldPkg, newPkg, targetRoute
  }) {
    commit('targetRoute', targetRoute);
    const sameCluster = state.clusterId && state.clusterId === id;
    const samePackage = oldPkg?.name === newPkg?.name;
    const sameProduct = oldProduct === product;
    const isMultiCluster = getters['isMultiCluster'];

    // Are we in the same cluster and package or product?
    if ( sameCluster && (samePackage || sameProduct)) {
      // Do nothing, we're already connected/connecting to this cluster
      return;
    }
    const oldPkgClusterStore = oldPkg?.stores.find(
      (s) => getters[`${ s.storeName }/isClusterStore`]
    )?.storeName;

    const newPkgClusterStore = newPkg?.stores.find(
      (s) => getters[`${ s.storeName }/isClusterStore`]
    )?.storeName;

    const productConfig = state['type-map']?.products?.find((p) => p.name === product);
    const forgetCurrentCluster = ((state.clusterId && id) || !samePackage) && !productConfig?.inExplorer;

    // Should we leave/forget the current cluster? Only if we're going from an existing cluster to a new cluster, or the package has changed
    // (latter catches cases like nav from explorer cluster A to epinio cluster A)
    // AND if the product not scoped to the explorer - a case for products that only exist within the explorer (i.e. Kubewarden)
    if ( forgetCurrentCluster ) {
      // Clear the old cluster state out if switching to a new one.
      // If there is not an id then stay connected to the old one behind the scenes,
      // so that the nav and header stay the same when going to things like prefs
      commit('clusterReady', false);
      commit('clusterId', undefined);
      await dispatch('cluster/unsubscribe');
      commit('cluster/reset');

      await dispatch('management/watch', {
        type:      MANAGEMENT.PROJECT,
        namespace: state.clusterId,
        stop:      true
      });

      commit('management/forgetType', MANAGEMENT.PROJECT);
      commit('catalog/reset');

      if (oldPkgClusterStore) {
        // Mirror actions on the 'cluster' store for our specific pkg `cluster` store
        await dispatch(`${ oldPkgClusterStore }/unsubscribe`);
        await commit(`${ oldPkgClusterStore }/reset`);
      }
    }

    if ( id ) {
      // Remember the current cluster
      dispatch('prefs/set', { key: CLUSTER_PREF, value: id });
      commit('clusterId', id);

      // Use a pseudo cluster ID to pretend we have a cluster... to ensure some screens that don't care about a cluster but 'require' one to show
      if (id === BLANK_CLUSTER) {
        commit('clusterReady', true);

        return;
      }
    } else {
      // Switching to a global page with no cluster id, keep it the same.
      return;
    }

    console.log(`Loading ${ isMultiCluster ? 'ECM ' : '' }cluster...`); // eslint-disable-line no-console

    // If we've entered a new store ensure everything has loaded correctly
    if (newPkgClusterStore) {
      // Mirror actions on the 'cluster' store for our specific pkg `cluster` store
      await dispatch(`${ newPkgClusterStore }/loadCluster`, { id });

      commit('clusterReady', true);
      console.log('Done loading pkg cluster:', newPkgClusterStore); // eslint-disable-line no-console

      // Everything below here is rancher/kube cluster specific
      return;
    }

    // Execute Rancher cluster specific code

    // This is a workaround for a timing issue where the mgmt cluster schema may not be available
    // Try and wait until the schema exists before proceeding
    await dispatch('management/waitForSchema', { type: MANAGEMENT.CLUSTER });

    // See if it really exists
    try {
      const cluster = await dispatch('management/find', {
        type: MANAGEMENT.CLUSTER,
        id,
        opt:  { url: `${ MANAGEMENT.CLUSTER }s/${ escape(id) }` }
      });

      if (!cluster.isReady) {
        // Treat an unready cluster the same as a missing one. This ensures that we safely take user to the home page instead of showing
        // an error page (useful if they've set the cluster as their home page and don't want to change their landing location)
        console.warn('Cluster is not ready, cannot load it:', cluster.nameDisplay); // eslint-disable-line no-console
        throw new Error('Unready cluster');
      }
    } catch {
      commit('clusterId', null);
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

    const fetchProjects = async() => {
      let limit = 30000;
      const sleep = 100;

      while ( limit > 0 && !state.managementReady ) {
        await setTimeout(() => {}, sleep);
        limit -= sleep;
      }

      if ( getters['management/schemaFor'](MANAGEMENT.PROJECT) ) {
        return dispatch('management/findAll', projectArgs);
      }
    };

    const res = await allHash({
      projects:   fetchProjects(),
      counts:     dispatch('cluster/findAll', { type: COUNT }),
      namespaces: dispatch('cluster/findAll', { type: NAMESPACE }),
      navLinks:   !!getters['cluster/schemaFor'](UI.NAV_LINK) && dispatch('cluster/findAll', { type: UI.NAV_LINK }),
    });

    await dispatch('cleanNamespaces');

    const filters = getters['prefs/get'](NAMESPACE_FILTERS)?.[id];
    const allNamespaces = res.namespaces;

    commit('updateNamespaces', {
      filters: filters || [ALL_USER],
      all:     allNamespaces,
    });

    if (getters['currentCluster'] && getters['currentCluster'].isHarvester) {
      await dispatch('cluster/findAll', { type: HCI.SETTING });
    }

    commit('clusterReady', true);

    console.log('Done loading cluster.'); // eslint-disable-line no-console
  },

  switchNamespaces({ commit, dispatch, getters }, { ids, key }) {
    const filters = getters['prefs/get'](NAMESPACE_FILTERS);

    dispatch('prefs/set', {
      key:   NAMESPACE_FILTERS,
      value: {
        ...filters,
        [key]: ids
      }
    });

    commit('updateNamespaces', { filters: ids });
  },

  async cleanNamespaces({ getters, dispatch }) {
    // Initialise / Remove any filters that the user no-longer has access to
    await dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }); // So they can be got byId below

    const filters = getters['prefs/get'](NAMESPACE_FILTERS);

    if ( !filters ) {
      dispatch('prefs/set', {
        key:   NAMESPACE_FILTERS,
        value: { }
      });

      return;
    }

    const cleanFilters = {};

    for ( const id in filters ) {
      const { clusterId } = splitNamespaceFilterKey(id);

      if ( getters['management/byId'](MANAGEMENT.CLUSTER, clusterId) ) {
        cleanFilters[id] = filters[id];
      }
    }

    if (Object.keys(filters).length !== Object.keys(cleanFilters).length) {
      console.debug('Unknown clusters have been removed from namespace filters list (before/after)', filters, cleanFilters); // eslint-disable-line no-console
      dispatch('prefs/set', {
        key:   NAMESPACE_FILTERS,
        value: cleanFilters
      });
    }
  },

  async onLogout(store) {
    const { dispatch, commit, state } = store;

    store.dispatch('gcStopIntervals');

    Object.values(this.$plugin.getPlugins()).forEach((p) => {
      if (p.onLogOut) {
        p.onLogOut(store);
      }
    });

    await dispatch('management/unsubscribe');
    commit('managementChanged', { ready: false });
    commit('management/reset');
    commit('prefs/reset');

    await dispatch('cluster/unsubscribe');
    commit('clusterReady', false);
    commit('clusterId', null);
    commit('cluster/reset');

    await dispatch('rancher/unsubscribe');
    commit('rancher/reset');
    commit('catalog/reset');

    const router = state.$router;
    const route = router.currentRoute;

    if ( route.name === 'index' ) {
      router.replace('/auth/login');
    } else {
      if (!process.server) {
        const backTo = window.localStorage.getItem(BACK_TO);

        const isLogin = route.name === 'auth-login' || route.path === '/login'; // Cover dashboard and case of log out from ember;
        const isLogout = route.name === 'auth-logout';

        if (!backTo && !isLogin && !isLogout) {
          window.localStorage.setItem(BACK_TO, window.location.href);
        }
      }

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
    Object.defineProperty(rootState, '$plugin', { value: nuxt.app.$plugin });
    Object.defineProperty(this, '$plugin', { value: nuxt.app.$plugin });

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
    commit('setError', { error: err, locationError: new Error('loadingError') });

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
  },

  setIsSingleProduct({ commit }, isSingleProduct) {
    commit(`setIsSingleProduct`, isSingleProduct);
  },

  unsubscribe( { state, dispatch }) {
    // It would be nice to grab all vuex module stores that we've registered, apparently this is only possible via the
    // internal properties store._modules.root._children.
    // So instead loop through all state entries to find stores
    return Object.entries(state).filter(([storeName, storeState]) => {
      if (storeState?.allowStreaming) {
        dispatch(`${ storeName }/unsubscribe`);
      }
    });
  },

  ...gcActions
};
