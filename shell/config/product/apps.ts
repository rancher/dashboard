import { IExtension } from '@shell/core/types';
import {
  ProductChildCustomPage,
  ProductChildResourcePage,
  ProductChildGroup,
  ProductMetadata
} from '@shell/core/plugin-types';

import {
  AGE,
  STATE,
  CHART,
  CHART_UPGRADE,
  NAMESPACE,
  NAME as NAME_COL,
  APP_SUMMARY,
  APPS_REPO_TYPE,
  APPS_REPO_URL,
  APPS_REPO_BRANCH,
  APPS_OP_ACTION,
  APPS_OP_RELEASE_NS,
  APPS_OP_RELEASE_NAME
} from '@shell/config/table-headers';

import { CATALOG } from '@shell/config/types';
import { STEVE_AGE_COL, STEVE_NAMESPACE_COL, STEVE_NAME_COL, STEVE_STATE_COL } from '@shell/config/pagination-table-headers';

export const NAME = 'apps';

export function $init(prodReg: IExtension) {
  const product: ProductMetadata = {
    name:                  NAME,
    removable:             false,
    labelKey:              'product.apps',
    weight:                97,
    ifHaveGroup:           'catalog.cattle.io',
    icon:                  'marketplace',
    showNamespaceFilter:   true,
    extendable:            true,
    showClusterSwitcher:   true, // this used to be the default behavior, now being overridden in the new prod registration format
    inStore:               'cluster', // this is the KEY to register a new prod, but show it in "explorer"
    startRouteWithProduct: false
  };

  const appsChartsPage: ProductChildCustomPage = {
    labelKey:  'catalog.charts.header',
    name:      'charts',
    component: () => import('@shell/pages/c/_cluster/apps/charts/index.vue'),
    config:    { namespaced: false },
  };

  const appsInstalledAppsPage: ProductChildResourcePage = {
    type:       CATALOG.APP,
    config:     { isCreatable: false, isEditable: false },
    headers:    [STATE, NAME_COL, NAMESPACE, CHART, CHART_UPGRADE, APP_SUMMARY, AGE],
    sspHeaders: [STEVE_STATE_COL, STEVE_NAME_COL, STEVE_NAMESPACE_COL, {
      ...CHART,
      sort:   ['spec.chart.metadata.name'],
      search: ['spec.chart.metadata.name'],
    }, {
      ...CHART_UPGRADE,
      sort:   false,
      search: false,
    },
    APP_SUMMARY,
    STEVE_AGE_COL]
  };

  const appsReposPage: ProductChildResourcePage = {
    type:       CATALOG.CLUSTER_REPO,
    config:     { listCreateButtonLabelKey: 'catalog.repo.add' },
    headers:    [STATE, NAME_COL, APPS_REPO_TYPE, APPS_REPO_URL, APPS_REPO_BRANCH, AGE],
    sspHeaders: [STEVE_STATE_COL, STEVE_NAME_COL, {
      ...APPS_REPO_TYPE,
      sort:   false,
      search: false,
    }, {
      ...APPS_REPO_URL,
      sort:   false,
      search: false,
    },
    APPS_REPO_BRANCH]
  };

  const appsOperationsPage: ProductChildResourcePage = {
    type:    CATALOG.OPERATION,
    config:  { isCreatable: false, isEditable: false },
    headers: [
      STATE,
      NAME_COL,
      NAMESPACE,
      APPS_OP_ACTION,
      APPS_OP_RELEASE_NS,
      APPS_OP_RELEASE_NAME,
      AGE
    ],
    sspHeaders: [
      STEVE_STATE_COL,
      STEVE_NAME_COL,
      STEVE_NAMESPACE_COL,
      APPS_OP_ACTION,
      APPS_OP_RELEASE_NS,
      APPS_OP_RELEASE_NAME,
      STEVE_AGE_COL
    ]
  };

  // this has impact in some e2e tests related to extensions
  const appsRepoPage: ProductChildResourcePage = {
    type:    CATALOG.REPO,
    headers: [STATE, NAME_COL, NAMESPACE, APPS_REPO_TYPE, APPS_REPO_URL, APPS_REPO_BRANCH, AGE],
  };

  prodReg.addProduct(
    product,
    [
      appsChartsPage,
      appsInstalledAppsPage,
      appsReposPage,
      appsOperationsPage,
      appsRepoPage
    ]
  );

  // Additional routes for the product that are not tied to a specific page,
  // ex: routes for details pages that can be accessed from multiple places in the UI
  prodReg.addRoute({
    path: '/c/:cluster/apps',
    name: 'c-cluster-apps',
    redirect(to) {
      return {
        name:   'c-cluster-apps-charts',
        params: {
          ...(to?.params || {}),
          product: NAME,
        }
      };
    },
  });

  prodReg.addRoute({
    path:      '/c/:cluster/apps/charts/chart',
    component: () => import('@shell/pages/c/_cluster/apps/charts/chart.vue'),
    name:      'c-cluster-apps-charts-chart',
  });
  prodReg.addRoute({
    path:      '/c/:cluster/apps/charts/install',
    component: () => import('@shell/pages/c/_cluster/apps/charts/install.vue'),
    name:      'c-cluster-apps-charts-install',
  });
  prodReg.addRoute({
    path: '/c/:cluster/apps/catalog.cattle.io.clusterrepo',
    name: 'c-cluster-apps-catalog-repo',
    redirect(to) {
      return {
        name:   'c-cluster-product-resource',
        params: {
          ...to.params,
          product:  NAME,
          resource: 'catalog.cattle.io.clusterrepo',
        }
      };
    },
  });
}
