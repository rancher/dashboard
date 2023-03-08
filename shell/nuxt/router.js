import Vue from 'vue'
import Router from 'vue-router'
import { normalizeURL, decode } from 'ufo'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _b1075e64 = () => interopDefault(import('../pages/about.vue' /* webpackChunkName: "pages/about" */))
const _99a1a59e = () => interopDefault(import('../pages/account/index.vue' /* webpackChunkName: "pages/account/index" */))
const _10f92ab2 = () => interopDefault(import('../pages/c/index.vue' /* webpackChunkName: "pages/c/index" */))
const _0dd7368b = () => interopDefault(import('../pages/clusters/index.vue' /* webpackChunkName: "pages/clusters/index" */))
const _a0a6a994 = () => interopDefault(import('../pages/diagnostic.vue' /* webpackChunkName: "pages/diagnostic" */))
const _6249d7c9 = () => interopDefault(import('../pages/fail-whale.vue' /* webpackChunkName: "pages/fail-whale" */))
const _8d3a64a4 = () => interopDefault(import('../pages/home.vue' /* webpackChunkName: "pages/home" */))
const _aa26f31e = () => interopDefault(import('../pages/prefs.vue' /* webpackChunkName: "pages/prefs" */))
const _11f3a39f = () => interopDefault(import('../pages/safeMode.vue' /* webpackChunkName: "pages/safeMode" */))
const _35190053 = () => interopDefault(import('../pages/support/index.vue' /* webpackChunkName: "pages/support/index" */))
const _da172982 = () => interopDefault(import('../pages/account/create-key.vue' /* webpackChunkName: "pages/account/create-key" */))
const _35d0be51 = () => interopDefault(import('../pages/auth/login.vue' /* webpackChunkName: "pages/auth/login" */))
const _5d4fd75c = () => interopDefault(import('../pages/auth/logout.vue' /* webpackChunkName: "pages/auth/logout" */))
const _0da94136 = () => interopDefault(import('../pages/auth/setup.vue' /* webpackChunkName: "pages/auth/setup" */))
const _9d01107e = () => interopDefault(import('../pages/auth/verify.vue' /* webpackChunkName: "pages/auth/verify" */))
const _52164cec = () => interopDefault(import('../pages/docs/toc.js' /* webpackChunkName: "pages/docs/toc" */))
const _06776753 = () => interopDefault(import('../pages/rio/mesh.vue' /* webpackChunkName: "pages/rio/mesh" */))
const _2992430e = () => interopDefault(import('../pages/c/_cluster/index.vue' /* webpackChunkName: "pages/c/_cluster/index" */))
const _71a3608e = () => interopDefault(import('../pages/docs/_doc.vue' /* webpackChunkName: "pages/docs/_doc" */))
const _5efe405e = () => interopDefault(import('../pages/c/_cluster/apps/index.vue' /* webpackChunkName: "pages/c/_cluster/apps/index" */))
const _7eff6fd8 = () => interopDefault(import('../pages/c/_cluster/auth/index.vue' /* webpackChunkName: "pages/c/_cluster/auth/index" */))
const _20a6f76e = () => interopDefault(import('../pages/c/_cluster/backup/index.vue' /* webpackChunkName: "pages/c/_cluster/backup/index" */))
const _ece6af92 = () => interopDefault(import('../pages/c/_cluster/cis/index.vue' /* webpackChunkName: "pages/c/_cluster/cis/index" */))
const _89e6b70e = () => interopDefault(import('../pages/c/_cluster/ecm/index.vue' /* webpackChunkName: "pages/c/_cluster/ecm/index" */))
const _0561a16b = () => interopDefault(import('../pages/c/_cluster/explorer/index.vue' /* webpackChunkName: "pages/c/_cluster/explorer/index" */))
const _9f4d6090 = () => interopDefault(import('../pages/c/_cluster/fleet/index.vue' /* webpackChunkName: "pages/c/_cluster/fleet/index" */))
const _0fa0d22e = () => interopDefault(import('../pages/c/_cluster/gatekeeper/index.vue' /* webpackChunkName: "pages/c/_cluster/gatekeeper/index" */))
const _1af88b1a = () => interopDefault(import('../pages/c/_cluster/istio/index.vue' /* webpackChunkName: "pages/c/_cluster/istio/index" */))
const _3facd8b5 = () => interopDefault(import('../pages/c/_cluster/legacy/index.vue' /* webpackChunkName: "pages/c/_cluster/legacy/index" */))
const _24bc84c9 = () => interopDefault(import('../pages/c/_cluster/logging/index.vue' /* webpackChunkName: "pages/c/_cluster/logging/index" */))
const _22d2372b = () => interopDefault(import('../pages/c/_cluster/longhorn/index.vue' /* webpackChunkName: "pages/c/_cluster/longhorn/index" */))
const _e66f80d2 = () => interopDefault(import('../pages/c/_cluster/manager/index.vue' /* webpackChunkName: "pages/c/_cluster/manager/index" */))
const _02abbf34 = () => interopDefault(import('../pages/c/_cluster/mcapps/index.vue' /* webpackChunkName: "pages/c/_cluster/mcapps/index" */))
const _e1577418 = () => interopDefault(import('../pages/c/_cluster/monitoring/index.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/index" */))
const _4954338b = () => interopDefault(import('../pages/c/_cluster/neuvector/index.vue' /* webpackChunkName: "pages/c/_cluster/neuvector/index" */))
const _86270f62 = () => interopDefault(import('../pages/c/_cluster/settings/index.vue' /* webpackChunkName: "pages/c/_cluster/settings/index" */))
const _0afff7f6 = () => interopDefault(import('../pages/c/_cluster/uiplugins/index.vue' /* webpackChunkName: "pages/c/_cluster/uiplugins/index" */))
const _3cd56cbc = () => interopDefault(import('../pages/c/_cluster/apps/charts/index.vue' /* webpackChunkName: "pages/c/_cluster/apps/charts/index" */))
const _11b0721a = () => interopDefault(import('../pages/c/_cluster/auth/config/index.vue' /* webpackChunkName: "pages/c/_cluster/auth/config/index" */))
const _25aea87c = () => interopDefault(import('../pages/c/_cluster/auth/roles/index.vue' /* webpackChunkName: "pages/c/_cluster/auth/roles/index" */))
const _74341dba = () => interopDefault(import('../pages/c/_cluster/explorer/ConfigBadge.vue' /* webpackChunkName: "pages/c/_cluster/explorer/ConfigBadge" */))
const _14bdf46e = () => interopDefault(import('../pages/c/_cluster/explorer/EventsTable.vue' /* webpackChunkName: "pages/c/_cluster/explorer/EventsTable" */))
const _a75fe116 = () => interopDefault(import('../pages/c/_cluster/explorer/explorer-utils.js' /* webpackChunkName: "pages/c/_cluster/explorer/explorer-utils" */))
const _01865512 = () => interopDefault(import('../pages/c/_cluster/explorer/tools/index.vue' /* webpackChunkName: "pages/c/_cluster/explorer/tools/index" */))
const _9c418d0e = () => interopDefault(import('../pages/c/_cluster/fleet/GitRepoGraphConfig.js' /* webpackChunkName: "pages/c/_cluster/fleet/GitRepoGraphConfig" */))
const _f1812060 = () => interopDefault(import('../pages/c/_cluster/gatekeeper/constraints/index.vue' /* webpackChunkName: "pages/c/_cluster/gatekeeper/constraints/index" */))
const _b539bb82 = () => interopDefault(import('../pages/c/_cluster/legacy/project/index.vue' /* webpackChunkName: "pages/c/_cluster/legacy/project/index" */))
const _44fb97b4 = () => interopDefault(import('../pages/c/_cluster/manager/cloudCredential/index.vue' /* webpackChunkName: "pages/c/_cluster/manager/cloudCredential/index" */))
const _17ce10e4 = () => interopDefault(import('../pages/c/_cluster/monitoring/alertmanagerconfig/index.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/alertmanagerconfig/index" */))
const _57f0357f = () => interopDefault(import('../pages/c/_cluster/monitoring/monitor/index.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/monitor/index" */))
const _acf430f8 = () => interopDefault(import('../pages/c/_cluster/monitoring/route-receiver/index.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/route-receiver/index" */))
const _9c1862f8 = () => interopDefault(import('../pages/c/_cluster/settings/banners.vue' /* webpackChunkName: "pages/c/_cluster/settings/banners" */))
const _83bd8ef8 = () => interopDefault(import('../pages/c/_cluster/settings/brand.vue' /* webpackChunkName: "pages/c/_cluster/settings/brand" */))
const _6ace98ec = () => interopDefault(import('../pages/c/_cluster/settings/DefaultLinksEditor.vue' /* webpackChunkName: "shell/pages/c/_cluster/settings/DefaultLinksEditor" */))
const _e56e5894 = () => interopDefault(import('../pages/c/_cluster/settings/links.vue' /* webpackChunkName: "pages/c/_cluster/settings/links" */))
const _0ff4c0ed = () => interopDefault(import('../pages/c/_cluster/settings/performance.vue' /* webpackChunkName: "pages/c/_cluster/settings/performance" */))
const _978f0576 = () => interopDefault(import('../pages/c/_cluster/uiplugins/DeveloperInstallDialog.vue' /* webpackChunkName: "pages/c/_cluster/uiplugins/DeveloperInstallDialog" */))
const _256d9147 = () => interopDefault(import('../pages/c/_cluster/uiplugins/InstallDialog.vue' /* webpackChunkName: "pages/c/_cluster/uiplugins/InstallDialog" */))
const _f6d8b8f2 = () => interopDefault(import('../pages/c/_cluster/uiplugins/PluginInfoPanel.vue' /* webpackChunkName: "pages/c/_cluster/uiplugins/PluginInfoPanel" */))
const _33e16f6c = () => interopDefault(import('../pages/c/_cluster/uiplugins/RemoveUIPlugins.vue' /* webpackChunkName: "pages/c/_cluster/uiplugins/RemoveUIPlugins" */))
const _d7c9a08a = () => interopDefault(import('../pages/c/_cluster/uiplugins/SetupUIPlugins.vue' /* webpackChunkName: "pages/c/_cluster/uiplugins/SetupUIPlugins" */))
const _266ebcce = () => interopDefault(import('../pages/c/_cluster/uiplugins/UninstallDialog.vue' /* webpackChunkName: "pages/c/_cluster/uiplugins/UninstallDialog" */))
const _69909470 = () => interopDefault(import('../pages/c/_cluster/apps/charts/chart.vue' /* webpackChunkName: "pages/c/_cluster/apps/charts/chart" */))
const _685cdef6 = () => interopDefault(import('../pages/c/_cluster/apps/charts/install.vue' /* webpackChunkName: "pages/c/_cluster/apps/charts/install" */))
const _5e92cb4c = () => interopDefault(import('../pages/c/_cluster/auth/group.principal/assign-edit.vue' /* webpackChunkName: "pages/c/_cluster/auth/group.principal/assign-edit" */))
const _97480d04 = () => interopDefault(import('../pages/c/_cluster/legacy/project/pipelines.vue' /* webpackChunkName: "pages/c/_cluster/legacy/project/pipelines" */))
const _fba8acec = () => interopDefault(import('../pages/c/_cluster/manager/cloudCredential/create.vue' /* webpackChunkName: "pages/c/_cluster/manager/cloudCredential/create" */))
const _646a75c2 = () => interopDefault(import('../pages/c/_cluster/monitoring/monitor/create.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/monitor/create" */))
const _a229588c = () => interopDefault(import('../pages/c/_cluster/monitoring/route-receiver/create.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/route-receiver/create" */))
const _24eaabc8 = () => interopDefault(import('../pages/c/_cluster/explorer/tools/pages/_page.vue' /* webpackChunkName: "pages/c/_cluster/explorer/tools/pages/_page" */))
const _77d0ea1b = () => interopDefault(import('../pages/c/_cluster/auth/config/_id.vue' /* webpackChunkName: "pages/c/_cluster/auth/config/_id" */))
const _58626ef4 = () => interopDefault(import('../pages/c/_cluster/legacy/pages/_page.vue' /* webpackChunkName: "pages/c/_cluster/legacy/pages/_page" */))
const _0e2466db = () => interopDefault(import('../pages/c/_cluster/legacy/project/_page.vue' /* webpackChunkName: "pages/c/_cluster/legacy/project/_page" */))
const _5b9811c8 = () => interopDefault(import('../pages/c/_cluster/manager/cloudCredential/_id.vue' /* webpackChunkName: "pages/c/_cluster/manager/cloudCredential/_id" */))
const _0f85fde8 = () => interopDefault(import('../pages/c/_cluster/manager/pages/_page.vue' /* webpackChunkName: "pages/c/_cluster/manager/pages/_page" */))
const _107ed876 = () => interopDefault(import('../pages/c/_cluster/mcapps/pages/_page.vue' /* webpackChunkName: "pages/c/_cluster/mcapps/pages/_page" */))
const _f12c4b3c = () => interopDefault(import('../pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/index.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/index" */))
const _25affaec = () => interopDefault(import('../pages/c/_cluster/monitoring/route-receiver/_id.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/route-receiver/_id" */))
const _0e9569c4 = () => interopDefault(import('../pages/c/_cluster/auth/roles/_resource/create.vue' /* webpackChunkName: "pages/c/_cluster/auth/roles/_resource/create" */))
const _0d1a9be2 = () => interopDefault(import('../pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/receiver.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/receiver" */))
const _1643de08 = () => interopDefault(import('../pages/c/_cluster/auth/roles/_resource/_id.vue' /* webpackChunkName: "pages/c/_cluster/auth/roles/_resource/_id" */))
const _30293caa = () => interopDefault(import('../pages/c/_cluster/monitoring/monitor/_namespace/_id.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/monitor/_namespace/_id" */))
const _3dcc28a0 = () => interopDefault(import('../pages/c/_cluster/navlinks/_group.vue' /* webpackChunkName: "pages/c/_cluster/navlinks/_group" */))
const _327638c8 = () => interopDefault(import('../pages/c/_cluster/_product/index.vue' /* webpackChunkName: "pages/c/_cluster/_product/index" */))
const _3feb57b4 = () => interopDefault(import('../pages/c/_cluster/_product/members/index.vue' /* webpackChunkName: "pages/c/_cluster/_product/members/index" */))
const _2e2d89c4 = () => interopDefault(import('../pages/c/_cluster/_product/namespaces.vue' /* webpackChunkName: "pages/c/_cluster/_product/namespaces" */))
const _76d90818 = () => interopDefault(import('../pages/c/_cluster/_product/projectsnamespaces.vue' /* webpackChunkName: "pages/c/_cluster/_product/projectsnamespaces" */))
const _587122fa = () => interopDefault(import('../pages/c/_cluster/_product/_resource/index.vue' /* webpackChunkName: "pages/c/_cluster/_product/_resource/index" */))
const _4530f1f8 = () => interopDefault(import('../pages/c/_cluster/_product/_resource/create.vue' /* webpackChunkName: "pages/c/_cluster/_product/_resource/create" */))
const _ac00c83c = () => interopDefault(import('../pages/c/_cluster/_product/_resource/_id.vue' /* webpackChunkName: "pages/c/_cluster/_product/_resource/_id" */))
const _1cac498f = () => interopDefault(import('../pages/c/_cluster/_product/_resource/_namespace/_id.vue' /* webpackChunkName: "pages/c/_cluster/_product/_resource/_namespace/_id" */))
const _7197a8da = () => interopDefault(import('../pages/index.vue' /* webpackChunkName: "pages/index" */))

const emptyFn = () => {}

Vue.use(Router)

export const routerOptions = {
  mode: 'history',
  base: '/',
  linkActiveClass: 'nuxt-link-active',
  linkExactActiveClass: 'nuxt-link-exact-active',
  scrollBehavior,

  routes: [{
    path: "/about",
    component: _b1075e64,
    name: "about"
  }, {
    path: "/account",
    component: _99a1a59e,
    name: "account"
  }, {
    path: "/c",
    component: _10f92ab2,
    name: "c"
  }, {
    path: "/clusters",
    component: _0dd7368b,
    name: "clusters"
  }, {
    path: "/diagnostic",
    component: _a0a6a994,
    name: "diagnostic"
  }, {
    path: "/fail-whale",
    component: _6249d7c9,
    name: "fail-whale"
  }, {
    path: "/home",
    component: _8d3a64a4,
    name: "home"
  }, {
    path: "/prefs",
    component: _aa26f31e,
    name: "prefs"
  }, {
    path: "/safeMode",
    component: _11f3a39f,
    name: "safeMode"
  }, {
    path: "/support",
    component: _35190053,
    name: "support"
  }, {
    path: "/account/create-key",
    component: _da172982,
    name: "account-create-key"
  }, {
    path: "/auth/login",
    component: _35d0be51,
    name: "auth-login"
  }, {
    path: "/auth/logout",
    component: _5d4fd75c,
    name: "auth-logout"
  }, {
    path: "/auth/setup",
    component: _0da94136,
    name: "auth-setup"
  }, {
    path: "/auth/verify",
    component: _9d01107e,
    name: "auth-verify"
  }, {
    path: "/docs/toc",
    component: _52164cec,
    name: "docs-toc"
  }, {
    path: "/rio/mesh",
    component: _06776753,
    name: "rio-mesh"
  }, {
    path: "/c/:cluster",
    component: _2992430e,
    name: "c-cluster"
  }, {
    path: "/docs/:doc?",
    component: _71a3608e,
    name: "docs-doc"
  }, {
    path: "/c/:cluster/apps",
    component: _5efe405e,
    name: "c-cluster-apps"
  }, {
    path: "/c/:cluster/auth",
    component: _7eff6fd8,
    name: "c-cluster-auth"
  }, {
    path: "/c/:cluster/backup",
    component: _20a6f76e,
    name: "c-cluster-backup"
  }, {
    path: "/c/:cluster/cis",
    component: _ece6af92,
    name: "c-cluster-cis"
  }, {
    path: "/c/:cluster/ecm",
    component: _89e6b70e,
    name: "c-cluster-ecm"
  }, {
    path: "/c/:cluster/explorer",
    component: _0561a16b,
    name: "c-cluster-explorer"
  }, {
    path: "/c/:cluster/fleet",
    component: _9f4d6090,
    name: "c-cluster-fleet"
  }, {
    path: "/c/:cluster/gatekeeper",
    component: _0fa0d22e,
    name: "c-cluster-gatekeeper"
  }, {
    path: "/c/:cluster/istio",
    component: _1af88b1a,
    name: "c-cluster-istio"
  }, {
    path: "/c/:cluster/legacy",
    component: _3facd8b5,
    name: "c-cluster-legacy"
  }, {
    path: "/c/:cluster/logging",
    component: _24bc84c9,
    name: "c-cluster-logging"
  }, {
    path: "/c/:cluster/longhorn",
    component: _22d2372b,
    name: "c-cluster-longhorn"
  }, {
    path: "/c/:cluster/manager",
    component: _e66f80d2,
    name: "c-cluster-manager"
  }, {
    path: "/c/:cluster/mcapps",
    component: _02abbf34,
    name: "c-cluster-mcapps"
  }, {
    path: "/c/:cluster/monitoring",
    component: _e1577418,
    name: "c-cluster-monitoring"
  }, {
    path: "/c/:cluster/neuvector",
    component: _4954338b,
    name: "c-cluster-neuvector"
  }, {
    path: "/c/:cluster/settings",
    component: _86270f62,
    name: "c-cluster-settings"
  }, {
    path: "/c/:cluster/uiplugins",
    component: _0afff7f6,
    name: "c-cluster-uiplugins"
  }, {
    path: "/c/:cluster/apps/charts",
    component: _3cd56cbc,
    name: "c-cluster-apps-charts"
  }, {
    path: "/c/:cluster/auth/config",
    component: _11b0721a,
    name: "c-cluster-auth-config"
  }, {
    path: "/c/:cluster/auth/roles",
    component: _25aea87c,
    name: "c-cluster-auth-roles"
  }, {
    path: "/c/:cluster/explorer/ConfigBadge",
    component: _74341dba,
    name: "c-cluster-explorer-ConfigBadge"
  }, {
    path: "/c/:cluster/explorer/EventsTable",
    component: _14bdf46e,
    name: "c-cluster-explorer-EventsTable"
  }, {
    path: "/c/:cluster/explorer/explorer-utils",
    component: _a75fe116,
    name: "c-cluster-explorer-explorer-utils"
  }, {
    path: "/c/:cluster/explorer/tools",
    component: _01865512,
    name: "c-cluster-explorer-tools"
  }, {
    path: "/c/:cluster/fleet/GitRepoGraphConfig",
    component: _9c418d0e,
    name: "c-cluster-fleet-GitRepoGraphConfig"
  }, {
    path: "/c/:cluster/gatekeeper/constraints",
    component: _f1812060,
    name: "c-cluster-gatekeeper-constraints"
  }, {
    path: "/c/:cluster/legacy/project",
    component: _b539bb82,
    name: "c-cluster-legacy-project"
  }, {
    path: "/c/:cluster/manager/cloudCredential",
    component: _44fb97b4,
    name: "c-cluster-manager-cloudCredential"
  }, {
    path: "/c/:cluster/monitoring/alertmanagerconfig",
    component: _17ce10e4,
    name: "c-cluster-monitoring-alertmanagerconfig"
  }, {
    path: "/c/:cluster/monitoring/monitor",
    component: _57f0357f,
    name: "c-cluster-monitoring-monitor"
  }, {
    path: "/c/:cluster/monitoring/route-receiver",
    component: _acf430f8,
    name: "c-cluster-monitoring-route-receiver"
  }, {
    path: "/c/:cluster/settings/banners",
    component: _9c1862f8,
    name: "c-cluster-settings-banners"
  }, {
    path: "/c/:cluster/settings/brand",
    component: _83bd8ef8,
    name: "c-cluster-settings-brand"
  }, {
    path: "/c/:cluster/settings/DefaultLinksEditor",
    component: _6ace98ec,
    name: "c-cluster-settings-DefaultLinksEditor"
  }, {
    path: "/c/:cluster/settings/links",
    component: _e56e5894,
    name: "c-cluster-settings-links"
  }, {
    path: "/c/:cluster/settings/performance",
    component: _0ff4c0ed,
    name: "c-cluster-settings-performance"
  }, {
    path: "/c/:cluster/uiplugins/DeveloperInstallDialog",
    component: _978f0576,
    name: "c-cluster-uiplugins-DeveloperInstallDialog"
  }, {
    path: "/c/:cluster/uiplugins/InstallDialog",
    component: _256d9147,
    name: "c-cluster-uiplugins-InstallDialog"
  }, {
    path: "/c/:cluster/uiplugins/PluginInfoPanel",
    component: _f6d8b8f2,
    name: "c-cluster-uiplugins-PluginInfoPanel"
  }, {
    path: "/c/:cluster/uiplugins/RemoveUIPlugins",
    component: _33e16f6c,
    name: "c-cluster-uiplugins-RemoveUIPlugins"
  }, {
    path: "/c/:cluster/uiplugins/SetupUIPlugins",
    component: _d7c9a08a,
    name: "c-cluster-uiplugins-SetupUIPlugins"
  }, {
    path: "/c/:cluster/uiplugins/UninstallDialog",
    component: _266ebcce,
    name: "c-cluster-uiplugins-UninstallDialog"
  }, {
    path: "/c/:cluster/apps/charts/chart",
    component: _69909470,
    name: "c-cluster-apps-charts-chart"
  }, {
    path: "/c/:cluster/apps/charts/install",
    component: _685cdef6,
    name: "c-cluster-apps-charts-install"
  }, {
    path: "/c/:cluster/auth/group.principal/assign-edit",
    component: _5e92cb4c,
    name: "c-cluster-auth-group.principal-assign-edit"
  }, {
    path: "/c/:cluster/legacy/project/pipelines",
    component: _97480d04,
    name: "c-cluster-legacy-project-pipelines"
  }, {
    path: "/c/:cluster/manager/cloudCredential/create",
    component: _fba8acec,
    name: "c-cluster-manager-cloudCredential-create"
  }, {
    path: "/c/:cluster/monitoring/monitor/create",
    component: _646a75c2,
    name: "c-cluster-monitoring-monitor-create"
  }, {
    path: "/c/:cluster/monitoring/route-receiver/create",
    component: _a229588c,
    name: "c-cluster-monitoring-route-receiver-create"
  }, {
    path: "/c/:cluster/explorer/tools/pages/:page?",
    component: _24eaabc8,
    name: "c-cluster-explorer-tools-pages-page"
  }, {
    path: "/c/:cluster/auth/config/:id",
    component: _77d0ea1b,
    name: "c-cluster-auth-config-id"
  }, {
    path: "/c/:cluster/legacy/pages/:page?",
    component: _58626ef4,
    name: "c-cluster-legacy-pages-page"
  }, {
    path: "/c/:cluster/legacy/project/:page",
    component: _0e2466db,
    name: "c-cluster-legacy-project-page"
  }, {
    path: "/c/:cluster/manager/cloudCredential/:id",
    component: _5b9811c8,
    name: "c-cluster-manager-cloudCredential-id"
  }, {
    path: "/c/:cluster/manager/pages/:page?",
    component: _0f85fde8,
    name: "c-cluster-manager-pages-page"
  }, {
    path: "/c/:cluster/mcapps/pages/:page?",
    component: _107ed876,
    name: "c-cluster-mcapps-pages-page"
  }, {
    path: "/c/:cluster/monitoring/alertmanagerconfig/:alertmanagerconfigid",
    component: _f12c4b3c,
    name: "c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid"
  }, {
    path: "/c/:cluster/monitoring/route-receiver/:id?",
    component: _25affaec,
    name: "c-cluster-monitoring-route-receiver-id"
  }, {
    path: "/c/:cluster/auth/roles/:resource/create",
    component: _0e9569c4,
    name: "c-cluster-auth-roles-resource-create"
  }, {
    path: "/c/:cluster/monitoring/alertmanagerconfig/:alertmanagerconfigid/receiver",
    component: _0d1a9be2,
    name: "c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid-receiver"
  }, {
    path: "/c/:cluster/auth/roles/:resource/:id?",
    component: _1643de08,
    name: "c-cluster-auth-roles-resource-id"
  }, {
    path: "/c/:cluster/monitoring/monitor/:namespace/:id?",
    component: _30293caa,
    name: "c-cluster-monitoring-monitor-namespace-id"
  }, {
    path: "/c/:cluster/navlinks/:group?",
    component: _3dcc28a0,
    name: "c-cluster-navlinks-group"
  }, {
    path: "/c/:cluster/:product",
    component: _327638c8,
    name: "c-cluster-product"
  }, {
    path: "/c/:cluster/:product/members",
    component: _3feb57b4,
    name: "c-cluster-product-members"
  }, {
    path: "/c/:cluster/:product/namespaces",
    component: _2e2d89c4,
    name: "c-cluster-product-namespaces"
  }, {
    path: "/c/:cluster/:product/projectsnamespaces",
    component: _76d90818,
    name: "c-cluster-product-projectsnamespaces"
  }, {
    path: "/c/:cluster/:product/:resource",
    component: _587122fa,
    name: "c-cluster-product-resource"
  }, {
    path: "/c/:cluster/:product/:resource/create",
    component: _4530f1f8,
    name: "c-cluster-product-resource-create"
  }, {
    path: "/c/:cluster/:product/:resource/:id",
    component: _ac00c83c,
    name: "c-cluster-product-resource-id"
  }, {
    path: "/c/:cluster/:product/:resource/:namespace/:id?",
    component: _1cac498f,
    name: "c-cluster-product-resource-namespace-id"
  }, {
    path: "/",
    component: _7197a8da,
    name: "index"
  }],

  fallback: false
}

export function createRouter (ssrContext, config) {
  const base = (config._app && config._app.basePath) || routerOptions.base
  const router = new Router({ ...routerOptions, base  })

  // TODO: remove in Nuxt 3
  const originalPush = router.push
  router.push = function push (location, onComplete = emptyFn, onAbort) {
    return originalPush.call(this, location, onComplete, onAbort)
  }

  const resolve = router.resolve.bind(router)
  router.resolve = (to, current, append) => {
    if (typeof to === 'string') {
      to = normalizeURL(to)
    }
    return resolve(to, current, append)
  }

  return router
}
