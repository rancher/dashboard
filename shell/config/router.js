import Vue from 'vue';
import Router from 'vue-router';
import { normalizeURL } from 'ufo';
import { interopDefault } from '../nuxt/utils';
import scrollBehavior from '../utils/router.scrollBehavior.js';

import { REDIRECTED } from '@shell/config/cookies';
import { UPGRADED, _FLAGGED, _UNFLAG, SETUP } from '@shell/config/query-params';
import { setFavIcon, haveSetFavIcon } from '@shell/utils/favicon';
import { checkIfItsFirstLogin, tryInitialSetup, handleAuthentication } from '@shell/utils/auth';
import { BACK_TO } from '@shell/config/local-storage';
import {
  getPackageFromRoute,
  getClusterFromRoute,
  getProductFromRoute,
  setProduct
} from '@shell/utils/router';
import { get } from '@shell/utils/object';
import { handlePackageRoutes } from '@shell/core/plugin-helpers';
import { AFTER_LOGIN_ROUTE, WORKSPACE } from '@shell/store/prefs';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet.js';
import { DEFAULT_WORKSPACE } from '@shell/config/types';
import { ClusterNotFoundError } from '@shell/utils/error';
import { applyProducts } from '@shell/store/type-map';

const emptyFn = () => {};
let appContext;

Vue.use(Router);

export function setAppContextOnRouter(app) {
  appContext = app;
}

export const routerOptions = {
  mode:                 'history',
  // Note: router base comes from the VUE_APP_ROUTER_BASE env var
  base:                 process.env.VUE_APP_ROUTER_BASE || '/',
  linkActiveClass:      'nuxt-link-active',
  linkExactActiveClass: 'nuxt-link-exact-active',
  scrollBehavior,

  routes: [{
    path:      '/about',
    component: () => interopDefault(import('../pages/about.vue' /* webpackChunkName: "pages/about" */)),
    name:      'about'
  }, {
    path:      '/account',
    component: () => interopDefault(import('../pages/account/index.vue' /* webpackChunkName: "pages/account/index" */)),
    name:      'account'
  }, {
    path:      '/c',
    component: () => interopDefault(import('../pages/c/index.vue' /* webpackChunkName: "pages/c/index" */)),
    name:      'c'
  }, {
    path:      '/clusters',
    component: () => interopDefault(import('../pages/clusters/index.vue' /* webpackChunkName: "pages/clusters/index" */)),
    name:      'clusters'
  }, {
    path:      '/diagnostic',
    component: () => interopDefault(import('../pages/diagnostic.vue' /* webpackChunkName: "pages/diagnostic" */)),
    name:      'diagnostic'
  }, {
    path:      '/fail-whale',
    component: () => interopDefault(import('../pages/fail-whale.vue' /* webpackChunkName: "pages/fail-whale" */)),
    name:      'fail-whale'
  }, {
    path:      '/home',
    component: () => interopDefault(import('../pages/home.vue' /* webpackChunkName: "pages/home" */)),
    name:      'home'
  }, {
    path:      '/prefs',
    component: () => interopDefault(import('../pages/prefs.vue' /* webpackChunkName: "pages/prefs" */)),
    name:      'prefs'
  }, {
    path:      '/safeMode',
    component: () => interopDefault(import('../pages/safeMode.vue' /* webpackChunkName: "pages/safeMode" */)),
    name:      'safeMode'
  }, {
    path:      '/support',
    component: () => interopDefault(import('../pages/support/index.vue' /* webpackChunkName: "pages/support/index" */)),
    name:      'support'
  }, {
    path:      '/account/create-key',
    component: () => interopDefault(import('../pages/account/create-key.vue' /* webpackChunkName: "pages/account/create-key" */)),
    name:      'account-create-key'
  }, {
    path:      '/auth/login',
    component: () => interopDefault(import('../pages/auth/login.vue' /* webpackChunkName: "pages/auth/login" */)),
    name:      'auth-login'
  }, {
    path:      '/auth/logout',
    component: () => interopDefault(import('../pages/auth/logout.vue' /* webpackChunkName: "pages/auth/logout" */)),
    name:      'auth-logout'
  }, {
    path:      '/auth/setup',
    component: () => interopDefault(import('../pages/auth/setup.vue' /* webpackChunkName: "pages/auth/setup" */)),
    name:      'auth-setup'
  }, {
    path:      '/auth/verify',
    component: () => interopDefault(import('../pages/auth/verify.vue' /* webpackChunkName: "pages/auth/verify" */)),
    name:      'auth-verify'
  }, {
    path:      '/docs/toc',
    component: () => interopDefault(import('../pages/docs/toc.js' /* webpackChunkName: "pages/docs/toc" */)),
    name:      'docs-toc'
  }, {
    path:      '/rio/mesh',
    component: () => interopDefault(import('../pages/rio/mesh.vue' /* webpackChunkName: "pages/rio/mesh" */)),
    name:      'rio-mesh'
  }, {
    path:      '/c/:cluster',
    component: () => interopDefault(import('../pages/c/_cluster/index.vue' /* webpackChunkName: "pages/c/_cluster/index" */)),
    name:      'c-cluster'
  }, {
    path:      '/docs/:doc?',
    component: () => interopDefault(import('../pages/docs/_doc.vue' /* webpackChunkName: "pages/docs/_doc" */)),
    name:      'docs-doc'
  }, {
    path:      '/c/:cluster/apps',
    component: () => interopDefault(import('../pages/c/_cluster/apps/index.vue' /* webpackChunkName: "pages/c/_cluster/apps/index" */)),
    name:      'c-cluster-apps'
  }, {
    path:      '/c/:cluster/auth',
    component: () => interopDefault(import('../pages/c/_cluster/auth/index.vue' /* webpackChunkName: "pages/c/_cluster/auth/index" */)),
    name:      'c-cluster-auth'
  }, {
    path:      '/c/:cluster/backup',
    component: () => interopDefault(import('../pages/c/_cluster/backup/index.vue' /* webpackChunkName: "pages/c/_cluster/backup/index" */)),
    name:      'c-cluster-backup'
  }, {
    path:      '/c/:cluster/cis',
    component: () => interopDefault(import('../pages/c/_cluster/cis/index.vue' /* webpackChunkName: "pages/c/_cluster/cis/index" */)),
    name:      'c-cluster-cis'
  }, {
    path:      '/c/:cluster/ecm',
    component: () => interopDefault(import('../pages/c/_cluster/ecm/index.vue' /* webpackChunkName: "pages/c/_cluster/ecm/index" */)),
    name:      'c-cluster-ecm'
  }, {
    path:      '/c/:cluster/explorer',
    component: () => interopDefault(import('../pages/c/_cluster/explorer/index.vue' /* webpackChunkName: "pages/c/_cluster/explorer/index" */)),
    name:      'c-cluster-explorer'
  }, {
    path:      '/c/:cluster/fleet',
    component: () => interopDefault(import('../pages/c/_cluster/fleet/index.vue' /* webpackChunkName: "pages/c/_cluster/fleet/index" */)),
    name:      'c-cluster-fleet'
  }, {
    path:      '/c/:cluster/gatekeeper',
    component: () => interopDefault(import('../pages/c/_cluster/gatekeeper/index.vue' /* webpackChunkName: "pages/c/_cluster/gatekeeper/index" */)),
    name:      'c-cluster-gatekeeper'
  }, {
    path:      '/c/:cluster/istio',
    component: () => interopDefault(import('../pages/c/_cluster/istio/index.vue' /* webpackChunkName: "pages/c/_cluster/istio/index" */)),
    name:      'c-cluster-istio'
  }, {
    path:      '/c/:cluster/legacy',
    component: () => interopDefault(import('../pages/c/_cluster/legacy/index.vue' /* webpackChunkName: "pages/c/_cluster/legacy/index" */)),
    name:      'c-cluster-legacy'
  }, {
    path:      '/c/:cluster/logging',
    component: () => interopDefault(import('../pages/c/_cluster/logging/index.vue' /* webpackChunkName: "pages/c/_cluster/logging/index" */)),
    name:      'c-cluster-logging'
  }, {
    path:      '/c/:cluster/longhorn',
    component: () => interopDefault(import('../pages/c/_cluster/longhorn/index.vue' /* webpackChunkName: "pages/c/_cluster/longhorn/index" */)),
    name:      'c-cluster-longhorn'
  }, {
    path:      '/c/:cluster/manager',
    component: () => interopDefault(import('../pages/c/_cluster/manager/index.vue' /* webpackChunkName: "pages/c/_cluster/manager/index" */)),
    name:      'c-cluster-manager'
  }, {
    path:      '/c/:cluster/mcapps',
    component: () => interopDefault(import('../pages/c/_cluster/mcapps/index.vue' /* webpackChunkName: "pages/c/_cluster/mcapps/index" */)),
    name:      'c-cluster-mcapps'
  }, {
    path:      '/c/:cluster/monitoring',
    component: () => interopDefault(import('../pages/c/_cluster/monitoring/index.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/index" */)),
    name:      'c-cluster-monitoring'
  }, {
    path:      '/c/:cluster/neuvector',
    component: () => interopDefault(import('../pages/c/_cluster/neuvector/index.vue' /* webpackChunkName: "pages/c/_cluster/neuvector/index" */)),
    name:      'c-cluster-neuvector'
  }, {
    path:      '/c/:cluster/settings',
    component: () => interopDefault(import('../pages/c/_cluster/settings/index.vue' /* webpackChunkName: "pages/c/_cluster/settings/index" */)),
    name:      'c-cluster-settings'
  }, {
    path:      '/c/:cluster/uiplugins',
    component: () => interopDefault(import('../pages/c/_cluster/uiplugins/index.vue' /* webpackChunkName: "pages/c/_cluster/uiplugins/index" */)),
    name:      'c-cluster-uiplugins'
  }, {
    path:      '/c/:cluster/apps/charts',
    component: () => interopDefault(import('../pages/c/_cluster/apps/charts/index.vue' /* webpackChunkName: "pages/c/_cluster/apps/charts/index" */)),
    name:      'c-cluster-apps-charts'
  }, {
    path:      '/c/:cluster/auth/config',
    component: () => interopDefault(import('../pages/c/_cluster/auth/config/index.vue' /* webpackChunkName: "pages/c/_cluster/auth/config/index" */)),
    name:      'c-cluster-auth-config'
  }, {
    path:      '/c/:cluster/auth/roles',
    component: () => interopDefault(import('../pages/c/_cluster/auth/roles/index.vue' /* webpackChunkName: "pages/c/_cluster/auth/roles/index" */)),
    name:      'c-cluster-auth-roles'
  }, {
    path:      '/c/:cluster/explorer/ConfigBadge',
    component: () => interopDefault(import('../pages/c/_cluster/explorer/ConfigBadge.vue' /* webpackChunkName: "pages/c/_cluster/explorer/ConfigBadge" */)),
    name:      'c-cluster-explorer-ConfigBadge'
  }, {
    path:      '/c/:cluster/explorer/EventsTable',
    component: () => interopDefault(import('../pages/c/_cluster/explorer/EventsTable.vue' /* webpackChunkName: "pages/c/_cluster/explorer/EventsTable" */)),
    name:      'c-cluster-explorer-EventsTable'
  }, {
    path:      '/c/:cluster/explorer/explorer-utils',
    component: () => interopDefault(import('../pages/c/_cluster/explorer/explorer-utils.js' /* webpackChunkName: "pages/c/_cluster/explorer/explorer-utils" */)),
    name:      'c-cluster-explorer-explorer-utils'
  }, {
    path:      '/c/:cluster/explorer/tools',
    component: () => interopDefault(import('../pages/c/_cluster/explorer/tools/index.vue' /* webpackChunkName: "pages/c/_cluster/explorer/tools/index" */)),
    name:      'c-cluster-explorer-tools'
  }, {
    path:      '/c/:cluster/fleet/GitRepoGraphConfig',
    component: () => interopDefault(import('../pages/c/_cluster/fleet/GitRepoGraphConfig.js' /* webpackChunkName: "pages/c/_cluster/fleet/GitRepoGraphConfig" */)),
    name:      'c-cluster-fleet-GitRepoGraphConfig'
  }, {
    path:      '/c/:cluster/gatekeeper/constraints',
    component: () => interopDefault(import('../pages/c/_cluster/gatekeeper/constraints/index.vue' /* webpackChunkName: "pages/c/_cluster/gatekeeper/constraints/index" */)),
    name:      'c-cluster-gatekeeper-constraints'
  }, {
    path:      '/c/:cluster/legacy/project',
    component: () => interopDefault(import('../pages/c/_cluster/legacy/project/index.vue' /* webpackChunkName: "pages/c/_cluster/legacy/project/index" */)),
    name:      'c-cluster-legacy-project'
  }, {
    path:      '/c/:cluster/manager/cloudCredential',
    component: () => interopDefault(import('../pages/c/_cluster/manager/cloudCredential/index.vue' /* webpackChunkName: "pages/c/_cluster/manager/cloudCredential/index" */)),
    name:      'c-cluster-manager-cloudCredential'
  }, {
    path:      '/c/:cluster/monitoring/alertmanagerconfig',
    component: () => interopDefault(import('../pages/c/_cluster/monitoring/alertmanagerconfig/index.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/alertmanagerconfig/index" */)),
    name:      'c-cluster-monitoring-alertmanagerconfig'
  }, {
    path:      '/c/:cluster/monitoring/monitor',
    component: () => interopDefault(import('../pages/c/_cluster/monitoring/monitor/index.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/monitor/index" */)),
    name:      'c-cluster-monitoring-monitor'
  }, {
    path:      '/c/:cluster/monitoring/route-receiver',
    component: () => interopDefault(import('../pages/c/_cluster/monitoring/route-receiver/index.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/route-receiver/index" */)),
    name:      'c-cluster-monitoring-route-receiver'
  }, {
    path:      '/c/:cluster/settings/banners',
    component: () => interopDefault(import('../pages/c/_cluster/settings/banners.vue' /* webpackChunkName: "pages/c/_cluster/settings/banners" */)),
    name:      'c-cluster-settings-banners'
  }, {
    path:      '/c/:cluster/settings/brand',
    component: () => interopDefault(import('../pages/c/_cluster/settings/brand.vue' /* webpackChunkName: "pages/c/_cluster/settings/brand" */)),
    name:      'c-cluster-settings-brand'
  }, {
    path:      '/c/:cluster/settings/DefaultLinksEditor',
    component: () => interopDefault(import('../pages/c/_cluster/settings/DefaultLinksEditor.vue' /* webpackChunkName: "shell/pages/c/_cluster/settings/DefaultLinksEditor" */)),
    name:      'c-cluster-settings-DefaultLinksEditor'
  }, {
    path:      '/c/:cluster/settings/links',
    component: () => interopDefault(import('../pages/c/_cluster/settings/links.vue' /* webpackChunkName: "pages/c/_cluster/settings/links" */)),
    name:      'c-cluster-settings-links'
  }, {
    path:      '/c/:cluster/settings/performance',
    component: () => interopDefault(import('../pages/c/_cluster/settings/performance.vue' /* webpackChunkName: "pages/c/_cluster/settings/performance" */)),
    name:      'c-cluster-settings-performance'
  }, {
    path:      '/c/:cluster/uiplugins/DeveloperInstallDialog',
    component: () => interopDefault(import('../pages/c/_cluster/uiplugins/DeveloperInstallDialog.vue' /* webpackChunkName: "pages/c/_cluster/uiplugins/DeveloperInstallDialog" */)),
    name:      'c-cluster-uiplugins-DeveloperInstallDialog'
  }, {
    path:      '/c/:cluster/uiplugins/InstallDialog',
    component: () => interopDefault(import('../pages/c/_cluster/uiplugins/InstallDialog.vue' /* webpackChunkName: "pages/c/_cluster/uiplugins/InstallDialog" */)),
    name:      'c-cluster-uiplugins-InstallDialog'
  }, {
    path:      '/c/:cluster/uiplugins/PluginInfoPanel',
    component: () => interopDefault(import('../pages/c/_cluster/uiplugins/PluginInfoPanel.vue' /* webpackChunkName: "pages/c/_cluster/uiplugins/PluginInfoPanel" */)),
    name:      'c-cluster-uiplugins-PluginInfoPanel'
  }, {
    path:      '/c/:cluster/uiplugins/RemoveUIPlugins',
    component: () => interopDefault(import('../pages/c/_cluster/uiplugins/RemoveUIPlugins.vue' /* webpackChunkName: "pages/c/_cluster/uiplugins/RemoveUIPlugins" */)),
    name:      'c-cluster-uiplugins-RemoveUIPlugins'
  }, {
    path:      '/c/:cluster/uiplugins/SetupUIPlugins',
    component: () => interopDefault(import('../pages/c/_cluster/uiplugins/SetupUIPlugins.vue' /* webpackChunkName: "pages/c/_cluster/uiplugins/SetupUIPlugins" */)),
    name:      'c-cluster-uiplugins-SetupUIPlugins'
  }, {
    path:      '/c/:cluster/uiplugins/UninstallDialog',
    component: () => interopDefault(import('../pages/c/_cluster/uiplugins/UninstallDialog.vue' /* webpackChunkName: "pages/c/_cluster/uiplugins/UninstallDialog" */)),
    name:      'c-cluster-uiplugins-UninstallDialog'
  }, {
    path:      '/c/:cluster/apps/charts/chart',
    component: () => interopDefault(import('../pages/c/_cluster/apps/charts/chart.vue' /* webpackChunkName: "pages/c/_cluster/apps/charts/chart" */)),
    name:      'c-cluster-apps-charts-chart'
  }, {
    path:      '/c/:cluster/apps/charts/install',
    component: () => interopDefault(import('../pages/c/_cluster/apps/charts/install.vue' /* webpackChunkName: "pages/c/_cluster/apps/charts/install" */)),
    name:      'c-cluster-apps-charts-install'
  }, {
    path:      '/c/:cluster/auth/group.principal/assign-edit',
    component: () => interopDefault(import('../pages/c/_cluster/auth/group.principal/assign-edit.vue' /* webpackChunkName: "pages/c/_cluster/auth/group.principal/assign-edit" */)),
    name:      'c-cluster-auth-group.principal-assign-edit'
  }, {
    path:      '/c/:cluster/legacy/project/pipelines',
    component: () => interopDefault(import('../pages/c/_cluster/legacy/project/pipelines.vue' /* webpackChunkName: "pages/c/_cluster/legacy/project/pipelines" */)),
    name:      'c-cluster-legacy-project-pipelines'
  }, {
    path:      '/c/:cluster/manager/cloudCredential/create',
    component: () => interopDefault(import('../pages/c/_cluster/manager/cloudCredential/create.vue' /* webpackChunkName: "pages/c/_cluster/manager/cloudCredential/create" */)),
    name:      'c-cluster-manager-cloudCredential-create'
  }, {
    path:      '/c/:cluster/monitoring/monitor/create',
    component: () => interopDefault(import('../pages/c/_cluster/monitoring/monitor/create.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/monitor/create" */)),
    name:      'c-cluster-monitoring-monitor-create'
  }, {
    path:      '/c/:cluster/monitoring/route-receiver/create',
    component: () => interopDefault(import('../pages/c/_cluster/monitoring/route-receiver/create.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/route-receiver/create" */)),
    name:      'c-cluster-monitoring-route-receiver-create'
  }, {
    path:      '/c/:cluster/explorer/tools/pages/:page?',
    component: () => interopDefault(import('../pages/c/_cluster/explorer/tools/pages/_page.vue' /* webpackChunkName: "pages/c/_cluster/explorer/tools/pages/_page" */)),
    name:      'c-cluster-explorer-tools-pages-page'
  }, {
    path:      '/c/:cluster/auth/config/:id',
    component: () => interopDefault(import('../pages/c/_cluster/auth/config/_id.vue' /* webpackChunkName: "pages/c/_cluster/auth/config/_id" */)),
    name:      'c-cluster-auth-config-id'
  }, {
    path:      '/c/:cluster/legacy/pages/:page?',
    component: () => interopDefault(import('../pages/c/_cluster/legacy/pages/_page.vue' /* webpackChunkName: "pages/c/_cluster/legacy/pages/_page" */)),
    name:      'c-cluster-legacy-pages-page'
  }, {
    path:      '/c/:cluster/legacy/project/:page',
    component: () => interopDefault(import('../pages/c/_cluster/legacy/project/_page.vue' /* webpackChunkName: "pages/c/_cluster/legacy/project/_page" */)),
    name:      'c-cluster-legacy-project-page'
  }, {
    path:      '/c/:cluster/manager/cloudCredential/:id',
    component: () => interopDefault(import('../pages/c/_cluster/manager/cloudCredential/_id.vue' /* webpackChunkName: "pages/c/_cluster/manager/cloudCredential/_id" */)),
    name:      'c-cluster-manager-cloudCredential-id'
  }, {
    path:      '/c/:cluster/manager/pages/:page?',
    component: () => interopDefault(import('../pages/c/_cluster/manager/pages/_page.vue' /* webpackChunkName: "pages/c/_cluster/manager/pages/_page" */)),
    name:      'c-cluster-manager-pages-page'
  }, {
    path:      '/c/:cluster/mcapps/pages/:page?',
    component: () => interopDefault(import('../pages/c/_cluster/mcapps/pages/_page.vue' /* webpackChunkName: "pages/c/_cluster/mcapps/pages/_page" */)),
    name:      'c-cluster-mcapps-pages-page'
  }, {
    path:      '/c/:cluster/monitoring/alertmanagerconfig/:alertmanagerconfigid',
    component: () => interopDefault(import('../pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/index.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/index" */)),
    name:      'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid'
  }, {
    path:      '/c/:cluster/monitoring/route-receiver/:id?',
    component: () => interopDefault(import('../pages/c/_cluster/monitoring/route-receiver/_id.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/route-receiver/_id" */)),
    name:      'c-cluster-monitoring-route-receiver-id'
  }, {
    path:      '/c/:cluster/auth/roles/:resource/create',
    component: () => interopDefault(import('../pages/c/_cluster/auth/roles/_resource/create.vue' /* webpackChunkName: "pages/c/_cluster/auth/roles/_resource/create" */)),
    name:      'c-cluster-auth-roles-resource-create'
  }, {
    path:      '/c/:cluster/monitoring/alertmanagerconfig/:alertmanagerconfigid/receiver',
    component: () => interopDefault(import('../pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/receiver.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/receiver" */)),
    name:      'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid-receiver'
  }, {
    path:      '/c/:cluster/auth/roles/:resource/:id?',
    component: () => interopDefault(import('../pages/c/_cluster/auth/roles/_resource/_id.vue' /* webpackChunkName: "pages/c/_cluster/auth/roles/_resource/_id" */)),
    name:      'c-cluster-auth-roles-resource-id'
  }, {
    path:      '/c/:cluster/monitoring/monitor/:namespace/:id?',
    component: () => interopDefault(import('../pages/c/_cluster/monitoring/monitor/_namespace/_id.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/monitor/_namespace/_id" */)),
    name:      'c-cluster-monitoring-monitor-namespace-id'
  }, {
    path:      '/c/:cluster/navlinks/:group?',
    component: () => interopDefault(import('../pages/c/_cluster/navlinks/_group.vue' /* webpackChunkName: "pages/c/_cluster/navlinks/_group" */)),
    name:      'c-cluster-navlinks-group'
  }, {
    path:      '/c/:cluster/:product',
    component: () => interopDefault(import('../pages/c/_cluster/_product/index.vue' /* webpackChunkName: "pages/c/_cluster/_product/index" */)),
    name:      'c-cluster-product'
  }, {
    path:      '/c/:cluster/:product/members',
    component: () => interopDefault(import('../pages/c/_cluster/_product/members/index.vue' /* webpackChunkName: "pages/c/_cluster/_product/members/index" */)),
    name:      'c-cluster-product-members'
  }, {
    path:      '/c/:cluster/:product/namespaces',
    component: () => interopDefault(import('../pages/c/_cluster/_product/namespaces.vue' /* webpackChunkName: "pages/c/_cluster/_product/namespaces" */)),
    name:      'c-cluster-product-namespaces'
  }, {
    path:      '/c/:cluster/:product/projectsnamespaces',
    component: () => interopDefault(import('../pages/c/_cluster/_product/projectsnamespaces.vue' /* webpackChunkName: "pages/c/_cluster/_product/projectsnamespaces" */)),
    name:      'c-cluster-product-projectsnamespaces'
  }, {
    path:      '/c/:cluster/:product/:resource',
    component: () => interopDefault(import('../pages/c/_cluster/_product/_resource/index.vue' /* webpackChunkName: "pages/c/_cluster/_product/_resource/index" */)),
    name:      'c-cluster-product-resource'
  }, {
    path:      '/c/:cluster/:product/:resource/create',
    component: () => interopDefault(import('../pages/c/_cluster/_product/_resource/create.vue' /* webpackChunkName: "pages/c/_cluster/_product/_resource/create" */)),
    name:      'c-cluster-product-resource-create'
  }, {
    path:      '/c/:cluster/:product/:resource/:id',
    component: () => interopDefault(import('../pages/c/_cluster/_product/_resource/_id.vue' /* webpackChunkName: "pages/c/_cluster/_product/_resource/_id" */)),
    name:      'c-cluster-product-resource-id'
  }, {
    path:      '/c/:cluster/:product/:resource/:namespace/:id?',
    component: () => interopDefault(import('../pages/c/_cluster/_product/_resource/_namespace/_id.vue' /* webpackChunkName: "pages/c/_cluster/_product/_resource/_namespace/_id" */)),
    name:      'c-cluster-product-resource-namespace-id'
  }, {
    path:      '/',
    component: () => interopDefault(import('../pages/index.vue' /* webpackChunkName: "pages/index" */)),
    name:      'index'
  }],

  fallback: false
};

export function createRouter(ssrContext, config) {
  console.error('CREATE ROUTER CONFIG', config); // eslint-disable-line no-console
  const base = (config._app && config._app.basePath) || routerOptions.base;
  const router = new Router({ ...routerOptions, base });

  // TODO: remove in Nuxt 3
  const originalPush = router.push;

  router.push = function push(location, onComplete = emptyFn, onAbort) {
    return originalPush.call(this, location, onComplete, onAbort);
  };

  const resolve = router.resolve.bind(router);

  router.resolve = (to, current, append) => {
    if (typeof to === 'string') {
      to = normalizeURL(to);
    }

    return resolve(to, current, append);
  };

  // setting up beforeEach global navigation guard
  _setBeforeEachNavigationGuard(router);

  // setting up afterEach global navigation guard
  if (process.client) {
    _setAfterEachNavigationGuard(router);
  }

  return router;
}

function _setBeforeEachNavigationGuard(router) {
  router.beforeEach(async(to, from, next) => {
    console.log('******************************************************'); // eslint-disable-line no-console
    console.log('******************************************************'); // eslint-disable-line no-console
    console.log('******************************************************'); // eslint-disable-line no-console
    console.log('beforeEach route to', to); // eslint-disable-line no-console
    console.log('beforeEach appContext', appContext); // eslint-disable-line no-console
    // initialize translation module (needed before loading internal products)
    await appContext.store.dispatch('i18n/init');

    // paths to ignore when routing... (webpack hot module and error page)
    if ( to.path && typeof to.path === 'string') {
      // Ignore webpack hot module reload requests
      if ( to.path.startsWith('/__webpack_hmr/') ) {
        return next({ name: 'home' }); // To home? I think that's a good compromise
      }

      // Ignore the error page
      if ( to.path.startsWith('/fail-whale') ) {
        return next({ name: 'home' }); // To home? I think that's a good compromise
      }
    }

    // This tells Ember not to redirect back to us once you've already been to dashboard once.
    // I THINK THIS MIGHT BE MOVED TO A HIGHER LEVEL JUST TO RUN ONCE...
    if ( !appContext.$cookies.get(REDIRECTED) ) {
      appContext.$cookies.set(REDIRECTED, 'true', {
        path:     '/',
        sameSite: true,
        secure:   true,
      });
    }

    // handle server upgrade with notification growl
    const upgraded = to.query[UPGRADED] === _FLAGGED;

    if ( upgraded ) {
      router.applyQuery({ [UPGRADED]: _UNFLAG });

      appContext.store.dispatch('growl/success', {
        title:   appContext.store.getters['i18n/t']('serverUpgrade.title'),
        message: appContext.store.getters['i18n/t']('serverUpgrade.message'),
        timeout: 0,
      });

      return next({ name: 'home' });
    }

    // Set the favicon - use custom one from store if set
    // I THINK THIS MIGHT BE MOVED TO A HIGHER LEVEL JUST TO RUN ONCE...
    if (!haveSetFavIcon()) {
      setFavIcon(appContext.store);
    }

    // If we had a redirect to these routes, there's no point proceeding from here on out...
    if (to.name === 'auth-setup' || to.name === 'auth-login') {
      return next();
    }

    // Handle first login on Dashboard
    let initialPass = to.query[SETUP];

    const checkLogin = await checkIfItsFirstLogin(appContext.store);

    if (!initialPass && checkLogin.plSetting?.value === 'Harvester') {
      initialPass = 'admin';
    }

    // TODO: show error if firstLogin and default pass doesn't work
    if ( checkLogin.firstLogin ) {
      console.error('FIRST LOGIN ON DASHBOARD'); // eslint-disable-line no-console
      const ok = await tryInitialSetup(appContext.store, initialPass);

      if (ok) {
        if (initialPass) {
          appContext.store.dispatch('auth/setInitialPass', initialPass);
        }

        return next({ name: 'auth-setup' });
      } else {
        return next({ name: 'auth-login' });
      }
    }

    // Handle authentication
    const checkRedirect = await handleAuthentication(appContext, to);

    console.error('checkRedirect', checkRedirect); // eslint-disable-line no-console

    // If the handleAuthentication throws out a redirect, handle it
    if (checkRedirect?.redirect) {
      console.error('REDIRECTING AGAIN AND AGAIN...'); // eslint-disable-line no-console

      return next(checkRedirect?.redirect);
    }

    // if we are not on a server setting, set a new url to get back to if it exists...
    if (!process.server) {
      const backTo = window.localStorage.getItem(BACK_TO);

      if (backTo) {
        window.localStorage.removeItem(BACK_TO);

        window.location.href = backTo;
      }
    }

    // set the product
    setProduct(appContext.store, to);

    // GC should be notified of route change before any find/get request is made that might be used for that page
    appContext.store.dispatch('gcRouteChanged', to);

    // // load internal products
    await applyProducts(appContext.store, appContext.$plugin);

    try {
      let clusterId = get(to, 'params.cluster');

      // Route can provide cluster ID via metadata
      if (!clusterId && to) {
        clusterId = getClusterFromRoute(to);
      }

      // Sometimes this needs to happen before or alongside other things... but is always needed
      // CHECK WHAT THIS DOES EXACTLY...
      await appContext.store.dispatch('loadManagement');

      const pkg = getPackageFromRoute(to);
      const product = getProductFromRoute(to);

      const oldPkg = getPackageFromRoute(from);
      const oldProduct = getProductFromRoute(from);

      const configParams = {
        clusterId,
        pkg,
        product,
        oldPkg,
        oldProduct
      };

      const newPkgRouteObj = await handlePackageRoutes(appContext, configParams, to, from);

      console.error('newPkgRouteObj', newPkgRouteObj);

      // If we have a new location, double check that it's actually valid
      const resolvedRoute = newPkgRouteObj.newLocation ? router.resolve(newPkgRouteObj.newLocation) : null;

      console.error('resolvedRoute', resolvedRoute);

      if (resolvedRoute?.route.matched.length) {
        return next(newPkgRouteObj.newLocation);
      }

      // Ensure that the activeNamespaceCache is updated given the change of context either from or to a place where it uses workspaces
      // When fleet moves to it's own package this should be moved to pkg onEnter/onLeave
      if ((oldProduct === FLEET_NAME || product === FLEET_NAME) && oldProduct !== product) {
        appContext.store.commit('updateWorkspace', {
          value:   appContext.store.getters['prefs/get'](WORKSPACE) || DEFAULT_WORKSPACE,
          getters: appContext.store.getters
        });
      }

      // loading current cluster
      // CHECK WHAT THIS DOES EXACTLY...
      await appContext.store.dispatch('loadCluster', {
        id:     clusterId,
        oldPkg: newPkgRouteObj.oldPkgPlugin,
        newPkg: newPkgRouteObj.newPkgPlugin,
        product,
        oldProduct,
      });

      // if there's no clusterId, we might be in a single product
      if (!clusterId) {
        clusterId = appContext.store.getters['defaultClusterId']; // This needs the cluster list
        const isSingleProduct = appContext.store.getters['isSingleProduct'];

        if (isSingleProduct?.afterLoginRoute) {
          const value = {
            name:   'c-cluster-product',
            ...isSingleProduct.afterLoginRoute,
            params: {
              cluster: clusterId,
              ...isSingleProduct.afterLoginRoute?.params
            },
          };

          await appContext.store.dispatch('prefs/set', {
            key: AFTER_LOGIN_ROUTE,
            value,
          });

          console.error('PATH 4'); // eslint-disable-line no-console

          return next();
        }

        console.error('PATH 1'); // eslint-disable-line no-console

        return next();
      }
      console.error('PATH 2'); // eslint-disable-line no-console

      return next();
    } catch (e) {
      console.error('PATH 3'); // eslint-disable-line no-console
      if ( e instanceof ClusterNotFoundError ) {
        return next({ name: 'home' });
      } else {
        appContext.store.commit('setError', { error: e, locationError: new Error('Auth Middleware') });

        next({ path: '/fail-whale' });
      }
    }
  });
}

function _setAfterEachNavigationGuard(router) {
  router.afterEach((to, from) => {
    // Clear state used to record if back button was used for navigation
    setTimeout(() => {
      window._popStateDetected = false;
    }, 1);
  });
}
