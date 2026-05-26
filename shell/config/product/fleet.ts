/* eslint-disable @typescript-eslint/ban-ts-comment */
/* @ts-nocheck */
import { IExtension } from '@shell/core/types';
import {
  ProductMetadata,
  ProductChildCustomPage,
  ProductChildResourcePage,
  ProductChildGroup
} from '@shell/core/plugin-types';

import { FLEET } from '@shell/config/types';
import { STATE, NAME as NAME_COL, AGE, FLEET_APPLICATION_TYPE } from '@shell/config/table-headers';
import { FLEET as FLEET_FEATURE } from '@shell/store/features';

export const SOURCE_TYPE = {
  REPO:    'repo',
  OCI:     'oci',
  TARBALL: 'tarball',
};

export const NAME = 'fleet';
export const CHART_NAME = 'fleet';

export function $init(prodReg: IExtension) {
  const product: ProductMetadata = {
    name:                  NAME,
    icon:                  'fleet',
    ifHaveType:            new RegExp(`${ FLEET.GIT_REPO }|${ FLEET.HELM_OP }`, 'i'),
    ifFeature:             FLEET_FEATURE,
    removable:             false,
    showClusterSwitcher:   false,
    showWorkspaceSwitcher: true,
    extendable:            true,
    labelKey:              'product.fleet',
    startRouteWithProduct: false
  };

  const fleetDashboardPage: ProductChildCustomPage = {
    name:      'dashboard',
    labelKey:  'fleet.dashboard.menuLabel',
    component: () => import('@shell/pages/c/_cluster/fleet/index.vue'),
    config:    { namespaced: false, exact: true },
  };

  const fleetApplicationPage: ProductChildCustomPage = {
    name:                 'application',
    labelKey:             'fleet.application.menuLabel',
    component:            () => import('@shell/pages/c/_cluster/fleet/application/index.vue'),
    config:               { namespaced: true, exact: false },
    customResourceConfig: {
      // should match the mashup of the type defined in "fleetDashboardPage"
      // we can hardcode this because it's an edge case
      type:   'fleet-application',
      config: {
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
        subTypes:               [
          FLEET.GIT_REPO,
          FLEET.HELM_OP
        ]
      }
    }
  };

  const fleetClusterPage: ProductChildResourcePage = {
    type:   FLEET.CLUSTER,
    config: { isCreatable: false }
  };

  const fleetClusterGroupPage: ProductChildResourcePage = { type: FLEET.CLUSTER_GROUP };

  const fleetWorkspacesPage: ProductChildResourcePage = {
    type:    FLEET.WORKSPACE,
    headers: [
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
    ]
  };

  const fleetGitRepoPage: ProductChildResourcePage = {
    type:   FLEET.GIT_REPO,
    config: { showListMasthead: false }
  };

  const fleetHelmOpPage: ProductChildResourcePage = {
    type:   FLEET.HELM_OP,
    config: { showListMasthead: false }
  };

  const fleetBundlePage: ProductChildResourcePage = { type: FLEET.BUNDLE };

  const fleetTokenPage: ProductChildResourcePage = { type: FLEET.TOKEN };

  const fleetBundleNamespaceMappingPage: ProductChildResourcePage = { type: FLEET.BUNDLE_NAMESPACE_MAPPING };

  const fleetGitRepoRestrictionPage: ProductChildResourcePage = { type: FLEET.GIT_REPO_RESTRICTION };

  const resourcesGroup: ProductChildGroup = {
    name:     'resources',
    label:    'Resources',
    children: [
      fleetGitRepoPage,
      fleetHelmOpPage,
      fleetBundleNamespaceMappingPage,
      fleetBundlePage,
      fleetTokenPage,
      fleetGitRepoRestrictionPage
    ],
  };

  prodReg.addProduct(
    product,
    [
      fleetDashboardPage,
      fleetApplicationPage,
      fleetClusterPage,
      fleetClusterGroupPage,
      resourcesGroup,
      fleetWorkspacesPage
    ]
  );
}
