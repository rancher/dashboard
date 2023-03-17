import { filterBy } from '@shell/utils/array';

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
