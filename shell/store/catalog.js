import { CATALOG } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { addParams } from '@shell/utils/url';
import { allHash, allHashSettled } from '@shell/utils/promise';
import { clone } from '@shell/utils/object';
import { findBy, addObject, filterBy, isArray } from '@shell/utils/array';
import { stringify } from '@shell/utils/error';
import { classify } from '@shell/plugins/dashboard-store/classify';
import { sortBy } from '@shell/utils/sort';
import { importChart } from '@shell/utils/dynamic-importer';
import { ensureRegex } from '@shell/utils/string';
import { isPrerelease } from '@shell/utils/version';
import difference from 'lodash/difference';
import { lookup } from '@shell/plugins/dashboard-store/model-loader';

const ALLOWED_CATEGORIES = [
  'Storage',
  'Monitoring',
  'Database',
  'Repository',
  'Security',
  'Networking',
  'PaaS',
  'Infrastructure',
  'Applications',
];

const CERTIFIED_SORTS = {
  [CATALOG_ANNOTATIONS._RANCHER]:      1,
  [CATALOG_ANNOTATIONS._EXPERIMENTAL]: 1,
  [CATALOG_ANNOTATIONS._PARTNER]:      2,
  other:                               3,
};

export const WINDOWS = 'windows';
export const LINUX = 'linux';

export const state = function() {
  return {
    loaded:          {},
    clusterRepos:    [],
    namespacedRepos: [],
    charts:          {},
    versionInfos:    {},
    config:          { namespace: 'catalog' },
    inStore:         undefined,
  };
};

export const getters = {
  isLoaded(state) {
    return (repo) => {
      return !!state.loaded[repo._key];
    };
  },

  repos(state) {
    const clustered = state.clusterRepos || [];
    const namespaced = state.namespacedRepos || [];

    return [...clustered, ...namespaced];
  },

  // Raw charts
  rawCharts(state) {
    return state.charts;
  },

  repo(state, getters) {
    return ({ repoType, repoName }) => {
      const ary = (repoType === 'cluster' ? state.clusterRepos : state.namespacedRepos);

      return findBy(ary, 'metadata.name', repoName);
    };
  },

  charts(state, getters, rootState, rootGetters) {
    const repoKeys = getters.repos.map(x => x._key);
    let cluster = rootGetters['currentCluster'];

    if ( rootGetters['currentProduct']?.inStore === 'management' ) {
      cluster = null;
    }

    // Filter out charts for repos that are no longer in the store, rather
    // than trying to clear them when a repo is removed.
    // And ones that are for the wrong kind of cluster
    const out = Object.values(state.charts).filter((chart) => {
      if ( !repoKeys.includes(chart.repoKey) ) {
        return false;
      }

      if ( cluster && chart.scope && chart.scope !== cluster.scope ) {
        return false;
      }

      return true;
    });

    return sortBy(out, ['certifiedSort', 'repoName', 'chartName']);
  },

  chart(state, getters) {
    return ({
      key, repoType, repoName, chartName, preferRepoType, preferRepoName, includeHidden
    }) => {
      if ( key && !repoType && !repoName && !chartName) {
        const parsed = parseKey(key);

        repoType = parsed.repoType;
        repoName = parsed.repoName;
        chartName = parsed.chartName;
      }

      let matching = filterBy(getters.charts, {
        repoType,
        repoName,
        chartName,
        deprecated: false,
      });

      if ( includeHidden === false ) {
        matching = matching.filter(x => !x.hidden);
      }

      if ( !matching.length ) {
        return;
      }

      if ( preferRepoType && preferRepoName ) {
        preferSameRepo(matching, preferRepoType, preferRepoName);
      }

      return matching[0];
    };
  },

  isInstalled(state, getters, rootState, rootGetters) {
    return ({ gvr }) => {
      let name, version;
      const idx = gvr.indexOf('/');

      if ( idx > 0 ) {
        name = gvr.substr(0, idx);
        version = gvr.substr(idx + 1);
      } else {
        name = gvr;
      }

      const inStore = rootGetters['currentProduct'].inStore;
      const schema = rootGetters[`${ inStore }/schemaFor`](name);

      if ( schema && (!version || schema.attributes.version === version) ) {
        return true;
      }

      return false;
    };
  },

  versionSatisfying(state, getters) {
    return ({
      repoType, repoName, constraint, chartVersion
    }) => {
      let name, wantVersion;
      const idx = constraint.indexOf('=');

      if ( idx > 0 ) {
        name = constraint.substr(0, idx);
        wantVersion = normalizeVersion(constraint.substr(idx + 1));
      } else {
        name = constraint;
        wantVersion = 'latest';
      }

      name = name.toLowerCase().trim();
      chartVersion = normalizeVersion(chartVersion);

      const matching = getters.charts.filter(chart => chart.chartName.toLowerCase().trim() === name);

      if ( !matching.length ) {
        return;
      }

      if ( repoType && repoName ) {
        preferSameRepo(matching, repoType, repoName);
      }

      const chart = matching[0];
      let version;

      if ( wantVersion === 'latest' ) {
        version = chart.versions[0];
      } else if ( wantVersion === 'match' || wantVersion === 'matching' ) {
        version = chart.versions.find(v => normalizeVersion(v.version) === chartVersion);
      } else {
        version = chart.versions.find(v => normalizeVersion(v.version) === wantVersion);
      }

      if ( version ) {
        return clone(version);
      }
    };
  },

  versionProviding(state, getters) {
    return ({ repoType, repoName, gvr }) => {
      const matching = getters.charts.filter(chart => chart.provides.includes(gvr) );

      if ( !matching.length ) {
        return;
      }

      if ( repoType && repoName ) {
        preferSameRepo(matching, repoType, repoName);
      }

      const version = matching[0].versions.find(version => version.annotations?.[CATALOG_ANNOTATIONS.PROVIDES] === gvr);

      if ( version ) {
        return clone(version);
      }
    };
  },

  version(state, getters) {
    return ({
      repoType, repoName, chartName, versionName
    }) => {
      const chart = getters['chart']({
        repoType, repoName, chartName
      });

      if ( !chart ) {
        return null;
      }

      let version;

      if ( versionName ) {
        version = findBy(chart.versions, 'version', versionName);
      } else {
        version = chart.versions[0];
      }

      if ( version ) {
        return clone(version);
      }
    };
  },

  errors(state) {
    return state.errors || [];
  },

  haveComponent() {
    return (name) => {
      return getters['type-map/hasCustomChart'](name);
    };
  },

  importComponent(state, getters) {
    return (name) => {
      return getters['type-map/importChart'](name);
    };
  },

  chartSteps(state, getters) {
    return (name) => {
      const steps = [];

      const stepsPath = `./${ name }/steps/`;
      // require.context only takes literals, so find all candidate step files and filter out
      const allPaths = require.context('@shell/chart', true, /\.vue$/).keys();

      allPaths
        .filter(path => path.startsWith(stepsPath))
        .forEach((path) => {
          try {
            steps.push({
              name:      path.replace(stepsPath, ''),
              component: importChart(path.substr(2, path.length)),
            });
          } catch (e) {
            console.warn(`Failed to load step component ${ path } for chart ${ name }`, e); // eslint-disable-line no-console
          }
        });

      return steps;
    };
  },

  inStore(state) {
    return state.inStore;
  },

  classify: (state, getters, rootState) => (obj) => {
    return lookup(state.config.namespace, obj?.type, obj?.metadata?.name, rootState);
  },
};

export const mutations = {
  reset(currentState) {
    const newState = state();

    Object.assign(currentState, newState);
  },

  setInStore(state, inStore) {
    state.inStore = inStore;
  },

  setRepos(state, { cluster, namespaced }) {
    state.clusterRepos = cluster;
    state.namespacedRepos = namespaced;
  },

  setCharts(state, { charts, errors = [], loaded = [] }) {
    state.charts = charts;
    state.errors = errors;

    for ( const repo of loaded ) {
      state.loaded[repo._key] = true;
    }
  },

  cacheVersion(state, { key, info }) {
    state.versionInfos[key] = info;
  }
};

export const actions = {
  async load(ctx, { force, reset } = {}) {
    const {
      state, getters, rootGetters, commit, dispatch
    } = ctx;

    let promises = {};
    // Installing an app? This is fine (in cluster store)
    // Fetching list of cluster templates? This is fine (in management store)
    // Installing a cluster template? This isn't fine (in cluster store as per installing app, but if there is no cluster we need to default to management)

    const inStore = rootGetters['currentCluster'] ? rootGetters['currentProduct'].inStore : 'management';

    if ( rootGetters[`${ inStore }/schemaFor`](CATALOG.CLUSTER_REPO) ) {
      promises.cluster = dispatch(`${ inStore }/findAll`, { type: CATALOG.CLUSTER_REPO }, { root: true });
    }

    if ( rootGetters[`${ inStore }/schemaFor`](CATALOG.REPO) ) {
      promises.namespaced = dispatch(`${ inStore }/findAll`, { type: CATALOG.REPO }, { root: true });
    }

    const hash = await allHash(promises);

    // As per comment above, when there are no clusters this will be management. Store it such that it can be used for those cases
    commit('setInStore', inStore);

    commit('setRepos', hash);

    const repos = getters['repos'];
    const loaded = [];

    promises = {};

    for ( const repo of repos ) {
      if ( (force === true || !getters.isLoaded(repo)) && repo.canLoad ) {
        console.info('Loading index for repo', repo.name, `(${ repo._key })`); // eslint-disable-line no-console
        promises[repo._key] = repo.followLink('index');
      }
    }

    const res = await allHashSettled(promises);
    const charts = reset ? {} : state.charts;
    const errors = [];

    for ( const key of Object.keys(res) ) {
      const obj = res[key];
      const repo = findBy(repos, '_key', key);

      if ( obj.status === 'rejected' ) {
        errors.push(stringify(obj.reason));
        continue;
      }

      for ( const k in obj.value.entries ) {
        for ( const entry of obj.value.entries[k] ) {
          addChart(ctx, charts, entry, repo);
        }
      }

      loaded.push(repo);
    }

    commit('setCharts', {
      charts,
      errors,
      loaded,
    });
  },

  async refresh({ getters, commit, dispatch }) {
    const promises = getters.repos.map(x => x.refresh());

    // @TODO wait for repo state to indicate they're done once the API has that

    await Promise.allSettled(promises);

    await dispatch('load', { force: true, reset: true });
  },

  /*
    Fetch full information about a specific version of a Helm chart,
    including the standard values and README.
  */
  async getVersionInfo({ state, getters, commit }, {
    repoType, repoName, chartName, versionName
  }) {
    const key = `${ repoType }/${ repoName }/${ chartName }/${ versionName }`;
    let info = state.versionInfos[key];

    if ( !info ) {
      const repo = getters['repo']({ repoType, repoName });

      if ( !repo ) {
        throw new Error('Repo not found');
      }

      info = await repo.followLink('info', {
        url: addParams(repo.links.info, {
          chartName,
          version: versionName
        })
      });

      commit('cacheVersion', { key, info });
    }

    return info;
  },

  rehydrate(ctx) {
    const { state, commit } = ctx;
    const charts = state.charts || {};

    Object.entries(state.charts).forEach(([key, chart]) => {
      if (chart.__rehydrate) {
        charts[key] = classify(ctx, chart);
      }
    });
    commit('setCharts', {
      charts,
      errors: state.errors,
    });
  }
};

export function generateKey(repoType, repoName, chartName) {
  return `${ repoType }/${ repoName }/${ chartName }`;
}

export function parseKey(key) {
  const parts = key.split('/');

  return {
    repoType:  parts[0],
    repoName:  parts[1],
    chartName: parts[2],
  };
}

function addChart(ctx, map, chart, repo) {
  const repoType = (repo.type === CATALOG.CLUSTER_REPO ? 'cluster' : 'namespace');
  const repoName = repo.metadata.name;
  const key = generateKey(repoType, repoName, chart.name);
  let obj = map[key];

  const certifiedAnnotation = chart.annotations?.[CATALOG_ANNOTATIONS.CERTIFIED];

  let certified = null;
  let sideLabel = null;

  if ( repo.isRancher ) {
    certified = CATALOG_ANNOTATIONS._RANCHER;
  } else if ( repo.isPartner ) {
    certified = CATALOG_ANNOTATIONS._PARTNER;
  } else {
    certified = CATALOG_ANNOTATIONS._OTHER;
  }

  if ( chart.annotations?.[CATALOG_ANNOTATIONS.EXPERIMENTAL] ) {
    sideLabel = 'Experimental';
  } else if (
    !repo.isRancherSource &&
    certifiedAnnotation &&
    certifiedAnnotation !== CATALOG_ANNOTATIONS._RANCHER &&
    certified === CATALOG_ANNOTATIONS._OTHER
  ) {
    // But anybody can set the side label
    sideLabel = certifiedAnnotation;
  }

  if ( !obj ) {
    if ( ctx ) { }
    obj = classify(ctx, {
      key,
      type:                'chart',
      id:                  key,
      certified,
      sideLabel,
      repoType,
      repoName,
      repoNameDisplay:     ctx.rootGetters['i18n/withFallback'](`catalog.repo.name."${ repoName }"`, null, repoName),
      certifiedSort:       CERTIFIED_SORTS[certified] || 99,
      icon:                chart.icon,
      color:               repo.color,
      chartType:           chart.annotations?.[CATALOG_ANNOTATIONS.TYPE] || CATALOG_ANNOTATIONS._APP,
      chartName:           chart.name,
      chartNameDisplay:    chart.annotations?.[CATALOG_ANNOTATIONS.DISPLAY_NAME] || chart.name,
      chartDescription:    chart.description,
      featured:            chart.annotations?.[CATALOG_ANNOTATIONS.FEATURED],
      repoKey:             repo._key,
      versions:            [],
      categories:          filterCategories(chart.keywords),
      deprecated:          !!chart.deprecated,
      hidden:              !!chart.annotations?.[CATALOG_ANNOTATIONS.HIDDEN],
      targetNamespace:     chart.annotations?.[CATALOG_ANNOTATIONS.NAMESPACE],
      targetName:          chart.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME],
      scope:               chart.annotations?.[CATALOG_ANNOTATIONS.SCOPE],
      provides:            [],
      windowsIncompatible: !(chart.annotations?.[CATALOG_ANNOTATIONS.PERMITTED_OS] || '').includes('windows'),
      deploysOnWindows:    (chart.annotations?.[CATALOG_ANNOTATIONS.DEPLOYED_OS] || '').includes('windows')
    });

    map[key] = obj;
  }

  chart.key = `${ key }/${ chart.version }`;
  chart.repoType = repoType;
  chart.repoName = repoName;

  const provides = chart.annotations?.[CATALOG_ANNOTATIONS.PROVIDES];

  if ( provides ) {
    addObject(obj.provides, provides);
  }

  obj.versions.push(chart);
}

function preferSameRepo(matching, repoType, repoName) {
  matching.sort((a, b) => {
    const aSameRepo = a.repoType === repoType && a.repoName === repoName ? 1 : 0;
    const bSameRepo = b.repoType === repoType && b.repoName === repoName ? 1 : 0;

    if ( aSameRepo && !bSameRepo ) {
      return -1;
    } else if ( !aSameRepo && bSameRepo ) {
      return 1;
    }

    return 0;
  });
}

function normalizeVersion(v) {
  return v.replace(/^v/i, '').toLowerCase().trim();
}

function filterCategories(categories) {
  categories = (categories || []).map(x => normalizeCategory(x));

  const out = [];

  for ( const c of ALLOWED_CATEGORIES ) {
    if ( categories.includes(normalizeCategory(c)) ) {
      addObject(out, c);
    }
  }

  return out;
}

function normalizeCategory(c) {
  return c.replace(/\s+/g, '').toLowerCase();
}

/*
catalog.cattle.io/deplys-on-os: OS -> requires global.cattle.OS.enabled: true
  default: nothing
catalog.cattle.io/permits-os: OS -> will break on clusters containing nodes that are not OS
  default if not found: catalog.cattle.io/permits-os: linux
*/
export function compatibleVersionsFor(chart, os, includePrerelease = true) {
  const versions = chart.versions;

  if (os && !isArray(os)) {
    os = [os];
  }

  return versions.filter((ver) => {
    const osPermitted = (ver?.annotations?.[CATALOG_ANNOTATIONS.PERMITTED_OS] || LINUX).split(',');

    if ( !includePrerelease && isPrerelease(ver.version) ) {
      return false;
    }

    if ( !os || difference(os, osPermitted).length === 0) {
      return true;
    }

    return false;
  });
}

export function filterAndArrangeCharts(charts, {
  clusterProvider = '',
  operatingSystems,
  category,
  searchQuery,
  showDeprecated = false,
  showHidden = false,
  showPrerelease = true,
  hideRepos = [],
  showRepos = [],
  showTypes = [],
  hideTypes = [],
} = {}) {
  const out = charts.filter((c) => {
    if (
      ( c.deprecated && !showDeprecated ) ||
      ( c.hidden && !showHidden ) ||
      ( hideRepos?.length && hideRepos.includes(c.repoKey) ) ||
      ( showRepos?.length && !showRepos.includes(c.repoKey) ) ||
      ( hideTypes?.length && hideTypes.includes(c.chartType) ) ||
      ( showTypes?.length && !showTypes.includes(c.chartType) ) ||
      (c.chartName === 'rancher-wins-upgrader' && clusterProvider === 'rke2')
    ) {
      return false;
    }

    if (compatibleVersionsFor(c, operatingSystems, showPrerelease).length <= 0) {
      // There's no versions compatible with the specified os
      return false;
    }

    if ( category && !c.categories.includes(category) ) {
      // The category filter doesn't match
      return false;
    }

    if ( searchQuery ) {
      // The search filter doesn't match
      const searchTokens = searchQuery.split(/\s*[, ]\s*/).map(x => ensureRegex(x, false));

      for ( const token of searchTokens ) {
        const chartDescription = c.chartDescription || '';

        if ( !c.chartNameDisplay.match(token) && !chartDescription.match(token) ) {
          return false;
        }
      }
    }

    return true;
  });

  return sortBy(out, ['certifiedSort', 'repoName', 'chartNameDisplay']);
}
