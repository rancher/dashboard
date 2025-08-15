import { DSL } from '@shell/store/type-map';
import { FLEET } from '@shell/config/types';
import { STATE, NAME as NAME_COL, AGE, FLEET_APPLICATION_TYPE } from '@shell/config/table-headers';
import { FLEET as FLEET_FEATURE } from '@shell/store/features';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';

export const SOURCE_TYPE = {
  REPO:    'repo',
  OCI:     'oci',
  TARBALL: 'tarball',
};

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
    ifHaveType:            new RegExp(`${ FLEET.GIT_REPO }|${ FLEET.HELM_OP }`, 'i'),
    ifFeature:             FLEET_FEATURE,
    icon:                  'fleet',
    inStore:               'management',
    removable:             false,
    showClusterSwitcher:   false,
    showWorkspaceSwitcher: true,
    to:                    {
      name:   'c-cluster-fleet',
      params: { resource: FLEET.DASHBOARD, cluster: BLANK_CLUSTER }
    },
  });

  virtualType({
    labelKey:   'fleet.dashboard.menuLabel',
    icon:       'folder',
    group:      'Root',
    namespaced: false,
    name:       FLEET.DASHBOARD,
    weight:     112,
    route:      {
      name:   'c-cluster-fleet',
      params: { resource: FLEET.DASHBOARD, cluster: BLANK_CLUSTER }
    },
    exact: true,
  });

  virtualType({
    labelKey:   'fleet.application.menuLabel',
    group:      'Root',
    namespaced: true,
    name:       FLEET.APPLICATION,
    weight:     111,
    route:      {
      name:   'c-cluster-fleet-application',
      params: { resource: FLEET.APPLICATION, cluster: BLANK_CLUSTER }
    },
    exact: false,
  });

  configureType(FLEET.APPLICATION, {
    subTypes: [
      FLEET.GIT_REPO,
      FLEET.HELM_OP
    ],
    location: {
      name:   'c-cluster-fleet-application',
      params: { resource: FLEET.APPLICATION, cluster: BLANK_CLUSTER }
    },
    listGroups: [
      {
        icon:       'icon-list-flat',
        value:      'none',
        tooltipKey: 'resourceTable.groupBy.none',
      },
      {
        icon:       'icon-repository',
        value:      'kind',
        field:      'kind',
        tooltipKey: 'fleet.application.groupBy',
        hideColumn: FLEET_APPLICATION_TYPE.name,
      }
    ],
    listGroupsWillOverride: true,
  });

  basicType([
    FLEET.DASHBOARD,
    FLEET.APPLICATION,
    FLEET.CLUSTER,
    FLEET.CLUSTER_GROUP,
    FLEET.WORKSPACE,
  ]);

  configureType(FLEET.CLUSTER, { isCreatable: false });

  weightType(FLEET.CLUSTER, 108, true);
  weightType(FLEET.CLUSTER_GROUP, 107, true);

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
      name:      'helmOps',
      labelKey:  'tableHeaders.helmOps',
      value:     'counts.helmOps',
      sort:      'counts.helmOps',
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

  basicType([
    FLEET.GIT_REPO,
    FLEET.HELM_OP,
    FLEET.BUNDLE,
    FLEET.TOKEN,
    FLEET.BUNDLE_NAMESPACE_MAPPING,
    FLEET.GIT_REPO_RESTRICTION
  ], 'resources');

  configureType(FLEET.GIT_REPO, { showListMasthead: false });
  configureType(FLEET.HELM_OP, { showListMasthead: false });

  weightType(FLEET.GIT_REPO, 110, true);
  weightType(FLEET.HELM_OP, 109, true);
}
