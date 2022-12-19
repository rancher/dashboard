import { DSL } from '@shell/store/type-map';
import { FLEET } from '@shell/config/types';
import { STATE, NAME as NAME_COL, AGE } from '@shell/config/table-headers';
import { FLEET as FLEET_FEATURE } from '@shell/store/features';
import { gitRepoGraphConfig } from '@shell/pages/c/_cluster/fleet/GitRepoGraphConfig';

export const NAME = 'fleet';
export const CHART_NAME = 'fleet';

export function init(store) {
  const {
    product,
    basicType,
    weightType,
    configureType,
    headers,
    // mapType,
    virtualType,
  } = DSL(store, NAME);

  product({
    ifHaveType:            FLEET.GIT_REPO,
    ifFeature:             FLEET_FEATURE,
    icon:                  'fleet',
    inStore:               'management',
    removable:             false,
    showClusterSwitcher:   false,
    showWorkspaceSwitcher: true,
  });

  virtualType({
    labelKey:   'fleet.dashboard.menuLabel',
    icon:       'folder',
    group:      'Root',
    namespaced: false,
    name:       FLEET.DASHBOARD,
    weight:     110,
    route:      {
      name:   'c-cluster-fleet',
      params: { resource: FLEET.DASHBOARD }
    },
    exact: true,
  });

  basicType([
    FLEET.DASHBOARD,
    FLEET.CLUSTER,
    FLEET.CLUSTER_GROUP,
    FLEET.GIT_REPO,
  ]);

  configureType(FLEET.CLUSTER, { isCreatable: false });
  configureType(FLEET.GIT_REPO, {
    showListMasthead: false, hasGraph: true, graphConfig: gitRepoGraphConfig
  });

  weightType(FLEET.GIT_REPO, 109, true);
  weightType(FLEET.CLUSTER, 108, true);
  weightType(FLEET.CLUSTER_GROUP, 107, true);

  basicType([
    FLEET.WORKSPACE,
    FLEET.BUNDLE,
    FLEET.TOKEN,
  ], 'advanced');

  headers(FLEET.WORKSPACE, [
    STATE,
    NAME_COL,
    {
      name:      'gitRepos',
      labelKey:  'tableHeaders.gitRepos',
      value:     'counts.gitRepos',
      sort:      'counts.gitRepos',
      formatter: 'Number',
    },
    {
      name:      'clusters',
      labelKey:  'tableHeaders.clusters',
      value:     'counts.clusters',
      sort:      'counts.clusters',
      formatter: 'Number',
    },
    {
      name:      'clusterGroups',
      labelKey:  'tableHeaders.clusterGroups',
      value:     'counts.clusterGroups',
      sort:      'counts.clusterGroups',
      formatter: 'Number',
    },
    AGE
  ]);
}
