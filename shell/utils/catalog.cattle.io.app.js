import { filterBy } from '@shell/utils/array';
import { sortBy } from '@shell/utils/sort';

export function preferSameRepo(matching, repoType, repoName) {
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

export function parseKey(key) {
  const parts = key.split('/');

  return {
    repoType:  parts[0],
    repoName:  parts[1],
    chartName: parts[2],
  };
}

export function repos(state) {
  const clustered = state.clusterRepos || [];
  const namespaced = state.namespacedRepos || [];

  return [...clustered, ...namespaced];
}

export function charts(state, getters, rootGetters) {
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
}

export function chart(charts) {
  return ({
    key, repoType, repoName, chartName, preferRepoType, preferRepoName, includeHidden
  }) => {
    if ( key && !repoType && !repoName && !chartName) {
      const parsed = parseKey(key);

      repoType = parsed.repoType;
      repoName = parsed.repoName;
      chartName = parsed.chartName;
    }

    let matchingCharts = filterBy(charts, {
      repoType,
      repoName,
      chartName,
      deprecated: false,
    });

    if ( includeHidden === false ) {
      matchingCharts = matchingCharts.filter(chart => !chart.hidden);
    }

    if ( !matchingCharts.length ) {
      return;
    }

    if ( preferRepoType && preferRepoName ) {
      preferSameRepo(matchingCharts, preferRepoType, preferRepoName);
    }

    return matchingCharts[0];
  };
}
