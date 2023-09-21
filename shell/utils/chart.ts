import difference from 'lodash/difference';
import { isArray } from '@shell/utils/array';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { LINUX } from '@shell/config/os';
import { isPrerelease } from 'utils/version';
import { ensureRegex } from '@shell/utils/string';
import { sortBy } from '@shell/utils/sort';
import { IChart, IChartVersions, IChartOptions } from 'types/catalog';

/*
catalog.cattle.io/deploys-on-os: OS -> requires global.cattle.OS.enabled: true
  default: nothing
catalog.cattle.io/permits-os: OS -> will break on clusters containing nodes that are not OS
  default if not found: catalog.cattle.io/permits-os: linux
*/
export function compatibleVersionsFor(chart: IChart, os?: string | string[], includePrerelease = true): IChartVersions[] {
  const versions = chart.versions;

  if (os && !isArray(os)) {
    os = [os as string];
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

export function filterAndArrangeCharts(charts: IChart[], {
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
}: IChartOptions = {}): IChart[] {
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
      const searchTokens = searchQuery.split(/\s*[, ]\s*/).map((x) => ensureRegex(x, false));

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
