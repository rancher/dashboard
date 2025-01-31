import { NAME as APPS } from '@shell/config/product/apps';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { NAME as MANAGER } from '@shell/config/product/manager';
import { CAPI, MANAGEMENT, BACKUP_RESTORE, CIS } from '@shell/config/types';
import { NAME as AUTH } from '@shell/config/product/auth';

// All these imports are related to the install-redirect.js navigation guard.
import { installRedirectRouteMeta } from '@shell/config/router/navigation-guards/install-redirect';
import { NAME as BACKUP_NAME, CHART_NAME as BACKUP_CHART_NAME } from '@shell/config/product/backup';
import { NAME as CIS_NAME, CHART_NAME as CIS_CHART_NAME } from '@shell/config/product/cis';
import { NAME as GATEKEEPER_NAME, CHART_NAME as GATEKEEPER_CHART_NAME } from '@shell/config/product/gatekeeper';
import { NAME as ISTIO_NAME, CHART_NAME as ISTIO_CHART_NAME } from '@shell/config/product/istio';
import { NAME as LOGGING_NAME, CHART_NAME as LOGGING_CHART_NAME } from '@shell/config/product/logging';
import { NAME as MONITORING_NAME, CHART_NAME as MONITORING_CHART_NAME } from '@shell/config/product/monitoring';
import { NAME as NEUVECTOR_NAME, CHART_NAME as NEUVECTOR_CHART_NAME } from '@shell/config/product/neuvector';
import { NAME as LONGHORN_NAME, CHART_NAME as LONGHORN_CHART_NAME } from '@shell/config/product/longhorn';

const interopDefault = (promise) => promise.then((page) => page.default || page);

/**
 * Note: router resolves routes in the order of this file, so if wrong route is being loaded, confirm that the order is correct
 * https://v3.router.vuejs.org/guide/essentials/dynamic-matching.html#matching-priority
 */
export default [
  {
    path:      '/',
    component: () => interopDefault(import('@shell/pages/index.vue')),
    meta:      { requiresAuthentication: true },
    children:  [
      {
        path:      '/',
        component: () => interopDefault(import('@shell/pages/index.vue')),
        name:      'index'
      },
    ]
  },
  {
    path:      '/fail-whale',
    component: () => interopDefault(import('@shell/pages/fail-whale.vue')),
    name:      'fail-whale'
  },
  {
    path:      '/',
    component: () => interopDefault(import('@shell/components/templates/blank.vue')),
    name:      'blank',
    meta:      { requiresAuthentication: true },
    children:  [
    ]
  },
  {
    path:      '/',
    component: () => interopDefault(import('@shell/components/templates/home.vue')),
    meta:      { requiresAuthentication: true },
    children:  [
      {
        path:      '/home',
        component: () => interopDefault(import('@shell/pages/home.vue')),
        name:      'home'
      },
      {
        path:      '/support',
        component: () => interopDefault(import('@shell/pages/support/index.vue')),
        name:      'support'
      },
    ]
  },
  {
    path:      '/',
    component: () => interopDefault(import('@shell/components/templates/plain.vue')),
    name:      'plain',
    meta:      { requiresAuthentication: true },
    children:  [
      {
        path:      '/about',
        component: () => interopDefault(import('@shell/pages/about.vue')),
        name:      'about'
      },
      {
        path:      '/c/:cluster/uiplugins',
        name:      'c-cluster-uiplugins',
        component: () => interopDefault(import('@shell/pages/c/_cluster/uiplugins/index.vue')),
      },

      {
        path:      '/diagnostic',
        component: () => interopDefault(import('@shell/pages/diagnostic.vue')),
        name:      'diagnostic'
      },
      {
        path:      '/prefs',
        component: () => interopDefault(import('@shell/pages/prefs.vue')),
        name:      'prefs'
      },
      {
        path:      '/account',
        component: () => interopDefault(import('@shell/pages/account/index.vue')),
        name:      'account'
      },
      {
        path:      '/account/create-key',
        component: () => interopDefault(import('@shell/pages/account/create-key.vue')),
        name:      'account-create-key'
      },
      {
        path: '/c/:cluster/auth',
        redirect(to) {
          return {
            name:   'c-cluster-product-resource',
            params: {
              ...(to?.params || {}),
              product:  AUTH,
              resource: MANAGEMENT.USER,
            }
          };
        },
        name: 'c-cluster-auth'
      },
      {
        path:      'ecm',
        component: () => interopDefault(import('@shell/pages/c/_cluster/ecm/index.vue')),
        name:      'c-cluster-ecm'
      },
      {
        path:      '/c/:cluster/settings',
        component: () => interopDefault(import('@shell/pages/c/_cluster/settings/index.vue')),
        name:      'c-cluster-settings'
      }
    ]
  },
  {
    path:      '/',
    component: () => interopDefault(import('@shell/components/templates/standalone.vue')),
    name:      'standalone',
    children:  [
    ]
  },
  {
    path:      '/',
    component: () => interopDefault(import('@shell/components/templates/unauthenticated.vue')),
    name:      'unauthenticated',
    children:  [
      {
        path:      '/auth/login',
        component: () => interopDefault(import('@shell/pages/auth/login.vue')),
        name:      'auth-login',
      },
      {
        path:      '/auth/logout',
        component: () => interopDefault(import('@shell/pages/auth/logout.vue')),
        name:      'auth-logout'
      },
      {
        path:      '/auth/setup',
        component: () => interopDefault(import('@shell/pages/auth/setup.vue')),
        name:      'auth-setup'
      }, {
        path:      '/auth/verify',
        component: () => interopDefault(import('@shell/pages/auth/verify.vue')),
        name:      'auth-verify'
      },
    ]
  },
  {
    path:      '/',
    component: () => interopDefault(import('@shell/components/templates/default.vue')),
    name:      'default',
    meta:      { requiresAuthentication: true },
    children:  [
      {
        path:      '/clusters',
        component: () => interopDefault(import('@shell/pages/clusters/index.vue')),
        name:      'clusters'
      },
      {
        path: '/c/:cluster',
        name: 'c-cluster',
        redirect(to) {
          return {
            name:   'c-cluster-explorer',
            params: {
              ...(to?.params || {}),
              product: EXPLORER,
            }
          };
        }
      },
      {
        path: '/c/:cluster/apps',
        redirect(to) {
          return {
            name:   'c-cluster-apps-charts',
            params: {
              ...(to?.params || {}),
              product: APPS,
            }
          };
        },
        name: 'c-cluster-apps'
      },
      {
        path:      '/c/:cluster/explorer',
        component: () => interopDefault(import('@shell/pages/c/_cluster/explorer/index.vue')),
        name:      'c-cluster-explorer'
      }, {
        path: '/c/:cluster/backup',
        name: 'c-cluster-backup',
        meta: { ...installRedirectRouteMeta(BACKUP_NAME, BACKUP_CHART_NAME, BACKUP_RESTORE.BACKUP) }
      }, {
        path: '/c/:cluster/cis',
        name: 'c-cluster-cis',
        meta: { ...installRedirectRouteMeta(CIS_NAME, CIS_CHART_NAME, CIS.CLUSTER_SCAN) }
      }, {
        path:      '/c/:cluster/fleet',
        component: () => interopDefault(import('@shell/pages/c/_cluster/fleet/index.vue')),
        name:      'c-cluster-fleet',
      }, {
        path:      '/c/:cluster/gatekeeper',
        component: () => interopDefault(import('@shell/pages/c/_cluster/gatekeeper/index.vue')),
        name:      'c-cluster-gatekeeper',
        meta:      { ...installRedirectRouteMeta(GATEKEEPER_NAME, GATEKEEPER_CHART_NAME) }
      }, {
        path:      '/c/:cluster/istio',
        component: () => interopDefault(import('@shell/pages/c/_cluster/istio/index.vue')),
        name:      'c-cluster-istio',
        meta:      { ...installRedirectRouteMeta(ISTIO_NAME, ISTIO_CHART_NAME) }
      }, {
        path: '/c/:cluster/legacy',
        redirect(to) {
          return {
            name:   'c-cluster-legacy-project',
            params: {
              ...(to?.params || {}),
              product: EXPLORER,
            }
          };
        },
        name: 'c-cluster-legacy'
      }, {
        path:      '/c/:cluster/logging',
        component: () => interopDefault(import('@shell/pages/c/_cluster/logging/index.vue')),
        name:      'c-cluster-logging',
        meta:      { ...installRedirectRouteMeta(LOGGING_NAME, LOGGING_CHART_NAME) }
      }, {
        path:      '/c/:cluster/longhorn',
        component: () => interopDefault(import('@shell/pages/c/_cluster/longhorn/index.vue')),
        name:      'c-cluster-longhorn',
        meta:      { ...installRedirectRouteMeta(LONGHORN_NAME, LONGHORN_CHART_NAME) }
      }, {
        path: '/c/:cluster/manager',
        redirect(to) {
          return {
            name:   'c-cluster-product-resource',
            params: {
              ...(to?.params || {}),
              product:  MANAGER,
              resource: CAPI.RANCHER_CLUSTER
            }
          };
        },
        name: 'c-cluster-manager'
      }, {
        path:      '/c/:cluster/monitoring',
        component: () => interopDefault(import('@shell/pages/c/_cluster/monitoring/index.vue')),
        name:      'c-cluster-monitoring',
        meta:      { ...installRedirectRouteMeta(MONITORING_NAME, MONITORING_CHART_NAME) }
      }, {

        path:      '/c/:cluster/manager/jwt.authentication',
        component: () => interopDefault(import('@shell/pages/c/_cluster/manager/jwt.authentication/index.vue')),
        name:      'c-cluster-manager-jwt-authentication'
      }, {

        path:      '/c/:cluster/neuvector',
        component: () => interopDefault(import('@shell/pages/c/_cluster/neuvector/index.vue')),
        name:      'c-cluster-neuvector',
        meta:      { ...installRedirectRouteMeta(NEUVECTOR_NAME, NEUVECTOR_CHART_NAME, undefined, false) }
      }, {
        path:      '/c/:cluster/apps/charts',
        component: () => interopDefault(import('@shell/pages/c/_cluster/apps/charts/index.vue')),
        name:      'c-cluster-apps-charts'
      },
      {
        path:      '/c/:cluster/apps/charts/install',
        component: () => interopDefault(import('@shell/pages/c/_cluster/apps/charts/install.vue')),
        name:      'c-cluster-apps-charts-install'
      },
      {
        path:      '/c/:cluster/auth/config',
        component: () => interopDefault(import('@shell/pages/c/_cluster/auth/config/index.vue')),
        name:      'c-cluster-auth-config'
      }, {
        path:      '/c/:cluster/auth/roles',
        component: () => interopDefault(import('@shell/pages/c/_cluster/auth/roles/index.vue')),
        name:      'c-cluster-auth-roles'
      }, {
        path:      '/c/:cluster/explorer/explorer-utils',
        component: () => interopDefault(import('@shell/pages/c/_cluster/explorer/explorer-utils.js')),
        name:      'c-cluster-explorer-explorer-utils'
      }, {
        path:      '/c/:cluster/explorer/tools',
        component: () => interopDefault(import('@shell/pages/c/_cluster/explorer/tools/index.vue')),
        name:      'c-cluster-explorer-tools'
      }, {
        path:      '/c/:cluster/gatekeeper/constraints',
        component: () => interopDefault(import('@shell/pages/c/_cluster/gatekeeper/constraints/index.vue')),
        name:      'c-cluster-gatekeeper-constraints'
      }, {
        path:      '/c/:cluster/legacy/project',
        component: () => interopDefault(import('@shell/pages/c/_cluster/legacy/project/index.vue')),
        name:      'c-cluster-legacy-project'
      }, {
        path:      '/c/:cluster/manager/cloudCredential',
        component: () => interopDefault(import('@shell/pages/c/_cluster/manager/cloudCredential/index.vue')),
        name:      'c-cluster-manager-cloudCredential'
      }, {
        path:      '/c/:cluster/manager/kontainerDriver',
        component: () => interopDefault(import('@shell/pages/c/_cluster/manager/drivers/kontainerDriver/index.vue')),
        name:      'c-cluster-manager-driver-kontainerdriver'
      }, {
        path:      '/c/:cluster/manager/nodeDriver',
        component: () => interopDefault(import('@shell/pages/c/_cluster/manager/drivers/nodeDriver/index.vue')),
        name:      'c-cluster-manager-driver-nodedriver'
      }, {
        path:      '/c/:cluster/monitoring/alertmanagerconfig',
        component: () => interopDefault(import('@shell/pages/c/_cluster/monitoring/alertmanagerconfig/index.vue')),
        name:      'c-cluster-monitoring-alertmanagerconfig'
      }, {
        path:      '/c/:cluster/monitoring/monitor',
        component: () => interopDefault(import('@shell/pages/c/_cluster/monitoring/monitor/index.vue')),
        name:      'c-cluster-monitoring-monitor'
      }, {
        path:      '/c/:cluster/monitoring/route-receiver',
        component: () => interopDefault(import('@shell/pages/c/_cluster/monitoring/route-receiver/index.vue')),
        name:      'c-cluster-monitoring-route-receiver'
      }, {
        path:      '/c/:cluster/settings/banners',
        component: () => interopDefault(import('@shell/pages/c/_cluster/settings/banners.vue')),
        name:      'c-cluster-settings-banners'
      }, {
        path:      '/c/:cluster/settings/brand',
        component: () => interopDefault(import('@shell/pages/c/_cluster/settings/brand.vue')),
        name:      'c-cluster-settings-brand'
      }, {
        path:      '/c/:cluster/settings/DefaultLinksEditor',
        component: () => interopDefault(import('@shell/pages/c/_cluster/settings/DefaultLinksEditor.vue')),
        name:      'c-cluster-settings-DefaultLinksEditor'
      }, {
        path:      '/c/:cluster/settings/links',
        component: () => interopDefault(import('@shell/pages/c/_cluster/settings/links.vue')),
        name:      'c-cluster-settings-links'
      }, {
        path:      '/c/:cluster/settings/performance',
        component: () => interopDefault(import('@shell/pages/c/_cluster/settings/performance.vue')),
        name:      'c-cluster-settings-performance'
      }, {
        path:      '/c/:cluster/apps/charts/chart',
        component: () => interopDefault(import('@shell/pages/c/_cluster/apps/charts/chart.vue')),
        name:      'c-cluster-apps-charts-chart'
      }, {
        path:      '/c/:cluster/auth/group.principal/assign-edit',
        component: () => interopDefault(import('@shell/pages/c/_cluster/auth/group.principal/assign-edit.vue')),
        name:      'c-cluster-auth-group.principal-assign-edit'
      }, {
        path:      '/c/:cluster/auth/user.retention',
        component: () => interopDefault(import('@shell/pages/c/_cluster/auth/user.retention/index.vue')),
        name:      'c-cluster-auth-user.retention'
      }, {
        path:      '/c/:cluster/manager/cloudCredential/create',
        component: () => interopDefault(import('@shell/pages/c/_cluster/manager/cloudCredential/create.vue')),
        name:      'c-cluster-manager-cloudCredential-create'
      }, {
        path:      '/c/:cluster/manager/kontainerDriver/create',
        component: () => interopDefault(import('@shell/pages/c/_cluster/manager/drivers/kontainerDriver/create.vue')),
        name:      'c-cluster-manager-driver-kontainerdriver-create'
      }, {
        path:      '/c/:cluster/manager/nodeDriver/create',
        component: () => interopDefault(import('@shell/pages/c/_cluster/manager/drivers/nodeDriver/create.vue')),
        name:      'c-cluster-manager-driver-nodedriver-create'
      }, {
        path:      '/c/:cluster/monitoring/monitor/create',
        component: () => interopDefault(import('@shell/pages/c/_cluster/monitoring/monitor/create.vue')),
        name:      'c-cluster-monitoring-monitor-create'
      }, {
        path:      '/c/:cluster/monitoring/route-receiver/create',
        component: () => interopDefault(import('@shell/pages/c/_cluster/monitoring/route-receiver/create.vue')),
        name:      'c-cluster-monitoring-route-receiver-create'
      }, {
        path:      '/c/:cluster/explorer/tools/pages/:page?',
        component: () => interopDefault(import('@shell/pages/c/_cluster/explorer/tools/pages/_page.vue')),
        name:      'c-cluster-explorer-tools-pages-page'
      }, {
        path:      '/c/:cluster/auth/config/:id',
        component: () => interopDefault(import('@shell/pages/c/_cluster/auth/config/_id.vue')),
        name:      'c-cluster-auth-config-id'
      }, {
        path:      '/c/:cluster/legacy/pages/:page?',
        component: () => interopDefault(import('@shell/pages/c/_cluster/legacy/pages/_page.vue')),
        name:      'c-cluster-legacy-pages-page'
      }, {
        path:      '/c/:cluster/legacy/project/:page',
        component: () => interopDefault(import('@shell/pages/c/_cluster/legacy/project/_page.vue')),
        name:      'c-cluster-legacy-project-page'
      }, {
        path:      '/c/:cluster/manager/cloudCredential/:id',
        component: () => interopDefault(import('@shell/pages/c/_cluster/manager/cloudCredential/_id.vue')),
        name:      'c-cluster-manager-cloudCredential-id'
      }, {
        path:      '/c/:cluster/manager/kontainerDriver/:id',
        component: () => interopDefault(import('@shell/pages/c/_cluster/manager/drivers/kontainerDriver/_id.vue')),
        name:      'c-cluster-manager-driver-kontainerdriver-id'
      }, {
        path:      '/c/:cluster/manager/nodeDriver/:id',
        component: () => interopDefault(import('@shell/pages/c/_cluster/manager/drivers/nodeDriver/_id.vue')),
        name:      'c-cluster-manager-driver-nodedriver-id'
      }, {
        path:      '/c/:cluster/manager/pages/:page?',
        component: () => interopDefault(import('@shell/pages/c/_cluster/manager/pages/_page.vue')),
        name:      'c-cluster-manager-pages-page'
      }, {
        path:      '/c/:cluster/monitoring/alertmanagerconfig/:alertmanagerconfigid',
        component: () => interopDefault(import('@shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/index.vue')),
        name:      'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid'
      }, {
        path:      '/c/:cluster/monitoring/route-receiver/:id?',
        component: () => interopDefault(import('@shell/pages/c/_cluster/monitoring/route-receiver/_id.vue')),
        name:      'c-cluster-monitoring-route-receiver-id'
      }, {
        path:      '/c/:cluster/auth/roles/:resource/create',
        component: () => interopDefault(import('@shell/pages/c/_cluster/auth/roles/_resource/create.vue')),
        name:      'c-cluster-auth-roles-resource-create'
      }, {
        path:      '/c/:cluster/monitoring/alertmanagerconfig/:alertmanagerconfigid/receiver',
        component: () => interopDefault(import('@shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/receiver.vue')),
        name:      'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid-receiver'
      }, {
        path:      '/c/:cluster/auth/roles/:resource/:id?',
        component: () => interopDefault(import('@shell/pages/c/_cluster/auth/roles/_resource/_id.vue')),
        name:      'c-cluster-auth-roles-resource-id'
      }, {
        path:      '/c/:cluster/monitoring/monitor/:namespace/:id?',
        component: () => interopDefault(import('@shell/pages/c/_cluster/monitoring/monitor/_namespace/_id.vue')),
        name:      'c-cluster-monitoring-monitor-namespace-id'
      }, {
        path:      '/c/:cluster/navlinks/:group?',
        component: () => interopDefault(import('@shell/pages/c/_cluster/navlinks/_group.vue')),
        name:      'c-cluster-navlinks-group'
      }, {
        path:      '/c/:cluster/:product',
        component: () => interopDefault(import('@shell/pages/c/_cluster/_product/index.vue')),
        name:      'c-cluster-product'
      }, {
        path:      '/c/:cluster/:product/members',
        component: () => interopDefault(import('@shell/pages/c/_cluster/_product/members/index.vue')),
        name:      'c-cluster-product-members'
      }, {
        path:      '/c/:cluster/:product/namespaces',
        component: () => interopDefault(import('@shell/pages/c/_cluster/_product/namespaces.vue')),
        name:      'c-cluster-product-namespaces'
      }, {
        path:      '/c/:cluster/:product/projectsnamespaces',
        component: () => interopDefault(import('@shell/pages/c/_cluster/_product/projectsnamespaces.vue')),
        name:      'c-cluster-product-projectsnamespaces'
      }, {
        path:      '/c/:cluster/:product/:resource',
        component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/index.vue')),
        name:      'c-cluster-product-resource'
      }, {
        path:      '/c/:cluster/:product/:resource/create',
        component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/create.vue')),
        name:      'c-cluster-product-resource-create'
      }, {
        path:      '/c/:cluster/:product/:resource/:id',
        component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/_id.vue')),
        name:      'c-cluster-product-resource-id'
      }, {
        path:      '/c/:cluster/:product/:resource/:namespace/:id',
        component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue')),
        name:      'c-cluster-product-resource-namespace-id'
      }]
  },
  {
    path:      '/:catchAll(.*)*',
    name:      '404',
    component: () => interopDefault(import('@shell/pages/404.vue')),
    meta:      { requiresAuthentication: true },
  },

];
