import { CATALOG } from '@/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@/config/labels-annotations';
import { addParams } from '@/utils/url';
import { allHash } from '@/utils/promise';
import { clone } from '@/utils/object';
import { findBy } from '@/utils/array';
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
    state, getters, commit, dispatch
  }, { force, reset } = {}) {
    const hash = await allHash({
      cluster:    dispatch('cluster/findAll', { type: CATALOG.CLUSTER_REPO }, { root: true }),
      namespaced: dispatch('cluster/findAll', { type: CATALOG.REPO }, { root: true }),
    });

    commit('setRepos', hash);

    const repos = getters['repos'];
    const loaded = [];
    const promises = [];

    for ( const repo of repos ) {
      if ( force === true || !getters.isLoaded(repo) ) {
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
    repoType, repoName, chartName, version
  }) {
    const key = `${ repoType }/${ repoName }/${ chartName }/${ version }`;
    let info = state.versionInfos[key];

    if ( !info ) {
      const repo = getters['repo']({ repoType, repoName });

      if ( !repo ) {
        throw new Error('Repo not found');
      }

      info = await repo.followLink('info', { url: addParams(repo.links.info, { chartName, version }) });

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

  if ( !obj ) {
    obj = {
      key,
      certified,
      sideLabel,
      certifiedSort:   CERTIFIED_SORTS[certified] || 99,
      icon:            chart.icon,
      chartName:       chart.name,
      description:     chart.description,
      repoKey:         repo._key,
      repoName:        repo.name,
      versions:        [],
      deprecated:      !!chart.deprecated,
      hidden:          !!chart.annotations?.[CATALOG_ANNOTATIONS.HIDDEN],
      targetNamespace: chart.annotations?.[CATALOG_ANNOTATIONS.NAMESPACE],
      targetName:      chart.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME],
    };

    if ( repo.type === CATALOG.CLUSTER_REPO ) {
      obj.repoType = 'cluster';
    } else {
      obj.repoType = 'namespace';
    }

    obj.repoName = repo.metadata.name;

    map[key] = obj;
  }

  chart.key = `${key}/${chart.version}`;

  obj.versions.push(chart);
}
