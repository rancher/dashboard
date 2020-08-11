import { CATALOG } from '@/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@/config/labels-annotations';
import { addParams } from '@/utils/url';
import { allHash } from '@/utils/promise';
import { clone } from '@/utils/object';
import { findBy, addObject } from '@/utils/array';
import { stringify } from '@/utils/error';

export const state = function() {
  return {
    loaded:          {},
    clusterRepos:    [],
    namespacedRepos: [],
    charts:          {},
    versionInfos:    {},
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

  repo(state, getters) {
    return ({ repoType, repoName }) => {
      const ary = (repoType === 'cluster' ? state.clusterRepos : state.namespacedRepos);

      return findBy(ary, 'metadata.name', repoName);
    };
  },

  charts(state, getters) {
    const repoKeys = getters.repos.map(x => x._key);

    // Filter out charts for repos that are no longer in the store, rather
    // than trying to clear them when a repo is removed.
    return Object.values(state.charts).filter(x => repoKeys.includes(x.repoKey));
  },

  chart(state, getters) {
    return ({ repoType, repoName, chartName }) => {
      const chart = findBy(getters.charts, {
        repoType, repoName, chartName
      });

      if ( chart ) {
        return clone(chart);
      }
    };
  },

  versionProviding(state, getters) {
    return ({ repoType, repoName, gvr }) => {
      const matching = getters.charts.filter((chart) => chart.provides.includes(gvr) )

      if ( repoType && repoName ) {
        matching.sort((a, b) => {
          const aSameRepo = a.repoType === repoType && a.repoName === repoName ? 1 : 0;
          const bSameRepo = b.repoType === repoType && b.repoName === repoName ? 1 : 0;

          if ( aSameRepo && !bSameRepo )  {
            return -1;
          } else if ( !aSameRepo && bSameRepo ) {
            return 1;
          }

          return 0;
        });
      }

      if ( !matching  && !matching.length ) {
        return;
      }

      const version = matching[0].versions.find((version) => version.annotations?.[CATALOG_ANNOTATIONS.PROVIDES] === gvr);

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

      const version = findBy(chart.versions, 'version', versionName);

      if ( version ) {
        return clone(version);
      }
    };
  },

  errors(state) {
    return state.errors || [];
  },

  haveComponent(state, getters) {
    return (name) => {
      try {
        require.resolve(`@/chart/${ name }`);
        return true;
      } catch (e) {
        return false;
      }
    };
  },

  importComponent(state, getters) {
    return (name) => {
      return () => import(`@/chart/${ name }`);
    };
  },
};

export const mutations = {
  reset(currentState) {
    const newState = state();

    Object.assign(currentState, newState);
  },

  setRepos(state, { cluster, namespaced }) {
    state.clusterRepos = cluster;
    state.namespacedRepos = namespaced;
  },

  setCharts(state, { charts, errors, loaded }) {
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
  async load({
    state, getters, rootGetters, commit, dispatch
  }, { force, reset } = {}) {

    let promises = {};
    if ( rootGetters['cluster/schemaFor'](CATALOG.CLUSTER_REPO) ) {
      promises.cluster = dispatch('cluster/findAll', { type: CATALOG.CLUSTER_REPO }, { root: true });
    }

    if ( rootGetters['cluster/schemaFor'](CATALOG.REPO) ) {
      promises.namespaced = dispatch('cluster/findAll', { type: CATALOG.REPO }, { root: true });
    }

    const hash = await allHash(promises);

    commit('setRepos', hash);

    const repos = getters['repos'];
    const loaded = [];
    promises = [];

    for ( const repo of repos ) {
      if ( (force === true || !getters.isLoaded(repo)) && repo.canLoad ) {
        console.info('Loading index for repo', repo.name, `(${repo._key})`); // eslint-disable-line no-console
        promises.push(repo.followLink('index'));
      }
    }

    const res = await Promise.allSettled(promises);

    const charts = reset ? {} : state.charts;
    const errors = [];

    for ( let i = 0 ; i < res.length ; i++ ) {
      const obj = res[i];
      const repo = repos[i];

      if ( obj.status === 'rejected' ) {
        errors.push(stringify(obj.reason));
        continue;
      }

      for ( const k in obj.value.entries ) {
        for ( const entry of obj.value.entries[k] ) {
          addChart(charts, entry, repo);
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

  refresh({ commit, dispatch }) {
    return dispatch('load', { force: true, reset: true });
  },

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
};

const CERTIFIED_SORTS = {
  [CATALOG_ANNOTATIONS._RANCHER]:      1,
  [CATALOG_ANNOTATIONS._EXPERIMENTAL]: 1,
  [CATALOG_ANNOTATIONS._PARTNER]:      2,
  other:                               3,
};

function addChart(map, chart, repo) {
  const key = `${ repo.type }/${ repo.metadata.name }/${ chart.name }`;
  let obj = map[key];
  const certifiedAnnotation = chart.annotations?.[CATALOG_ANNOTATIONS.CERTIFIED];

  let certified = CATALOG_ANNOTATIONS._OTHER;
  let sideLabel = null;

  if ( repo.isRancher ) {
    // Only charts from a rancher repo can actually set the certified flag
    certified = certifiedAnnotation || certified;
  }

  if ( chart.annotations?.[CATALOG_ANNOTATIONS.EXPERIMENTAL] ) {
    sideLabel = 'Experimental';
  } else if (
    !repo.isRancher &&
    certifiedAnnotation &&
    certifiedAnnotation !== CATALOG_ANNOTATIONS._RANCHER &&
    certified === CATALOG_ANNOTATIONS._OTHER
  ) {
    // But anybody can set the side label
    sideLabel = certifiedAnnotation;
  }

  const repoType = (repo.type === CATALOG.CLUSTER_REPO ? 'cluster' : 'namespace');
  const repoName = repo.metadata.name;

  if ( !obj ) {
    obj = {
      key,
      certified,
      sideLabel,
      repoType,
      repoName,
      certifiedSort:   CERTIFIED_SORTS[certified] || 99,
      icon:            chart.icon,
      chartName:       chart.name,
      description:     chart.description,
      repoKey:         repo._key,
      versions:        [],
      deprecated:      !!chart.deprecated,
      hidden:          !!chart.annotations?.[CATALOG_ANNOTATIONS.HIDDEN],
      targetNamespace: chart.annotations?.[CATALOG_ANNOTATIONS.NAMESPACE],
      targetName:      chart.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME],
      provides:        [],
    };

    map[key] = obj;
  }

  chart.key = `${key}/${chart.version}`;
  chart.repoType = repoType;
  chart.repoName = repoName;

  const provides = chart.annotations?.[CATALOG_ANNOTATIONS.PROVIDES];
  if ( provides ) {
    addObject(obj.provides, provides);
  }

  obj.versions.push(chart);
}
