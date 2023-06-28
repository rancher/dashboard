import Vue from 'vue';
import Router from 'vue-router';
import { normalizeURL } from 'ufo';
import { interopDefault } from '../utils/nuxt';
import scrollBehavior from '../utils/router.scrollBehavior.js';

const emptyFn = () => {};

Vue.use(Router);

export const routerOptions = {
  mode:                 'history',
  // Note: router base comes from the ROUTER_BASE env var
  base:                 process.env.routerBase || '/',
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
    component: () => interopDefault(import('../pages/c/_cluster/settings/DefaultLinksEditor.vue' /* webpackChunkName: "pages/c/_cluster/settings/DefaultLinksEditor" */)),
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

  return router;
}
