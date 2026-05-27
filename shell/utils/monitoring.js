// Helpers for determining if V2 or v1 Monitoring are installed

import {
  CATALOG,
  CONFIG_MAP,
  COUNT,
  ENDPOINTS,
  MONITORING,
  SCHEMA
} from '@shell/config/types';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { findBy } from '@shell/utils/array';
import { isEmpty } from '@shell/utils/object';

export const CATTLE_MONITORING_NAMESPACE = 'cattle-monitoring-system';

const MONITORING_APP_IDS = [
  `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring`,
  `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-dashboards`,
];

const MONITORING_DASHBOARD_VALUES_CONFIG_MAP_IDS = [
  `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-dashboard-values`,
  `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-dashboards-dashboard-values`,
];

// Can be used inside a components' computed property
export function monitoringStatus() {
  return {
    monitoringStatus() {
      const status = { v2: haveV2Monitoring(this.$store.getters) };

      status.installed = status.v1 || status.v2;

      return status;
    }
  };
}

export function haveV2Monitoring(getters) {
  const inStore = getters['getStoreNameByProductId'];
  const apps = getters[`${ inStore }/all`](CATALOG.APP) || [];

  const counts = getters[`${ inStore }/all`](COUNT)?.[0]?.counts || {};
  const monitoringApps = counts?.[CATALOG.APP]?.namespaces?.[CATTLE_MONITORING_NAMESPACE];
  const monitoringApp = MONITORING_APP_IDS.some((id) => findBy(apps, 'id', id));

  if (monitoringApps || monitoringApp) {
    return true;
  }

  const schemas = getters[`${ inStore }/all`](SCHEMA);
  const exists = findBy(schemas, 'id', normalizeType(MONITORING.PODMONITOR));

  return !!exists;
}

export async function getMonitoringApp(store, storeName = 'cluster') {
  if (!store.getters[`${ storeName }/canList`](CATALOG.APP)) {
    return null;
  }

  for (const id of MONITORING_APP_IDS) {
    console.log({ id });
    try {
      return await store.dispatch(`${ storeName }/find`, { type: CATALOG.APP, id });
    } catch {
      // App not found under this ID, try the next one
    }
  }

  return null;
}

export function getMonitoringDashboardValues(monitoringApp) {
  console.log({ monitoringApp });

  return monitoringApp?.status?.dashboardValues || {};
}

export function getConfigMapMonitoringDashboardValues(configMap) {
  const rawValues = configMap?.data?.['values.json'];

  if (!rawValues) {
    return {};
  }

  try {
    return JSON.parse(rawValues) || {};
  } catch (e) {
    console.error('Failed to parse monitoring dashboard metadata from ConfigMap', e); // eslint-disable-line no-console

    return {};
  }
}

export async function getMonitoringValuesConfigMap(store, storeName = 'cluster') {
  if (!store.getters[`${ storeName }/schemaFor`](CONFIG_MAP)) {
    return null;
  }

  for (const id of MONITORING_DASHBOARD_VALUES_CONFIG_MAP_IDS) {
    try {
      return await store.dispatch(`${ storeName }/find`, { type: CONFIG_MAP, id });
    } catch {
      // ConfigMap not found under this ID, try the next one
    }
  }

  return null;
}

export async function getClusterMonitoringDashboardValues(store, storeName = 'cluster') {
  const monitoringApp = await getMonitoringApp(store, storeName);
  const appDashboardValues = getMonitoringDashboardValues(monitoringApp);

  if (!isEmpty(appDashboardValues)) {
    return appDashboardValues;
  }

  const configMap = await getMonitoringValuesConfigMap(store, storeName);

  return getConfigMapMonitoringDashboardValues(configMap);
}

export function isDashboardOnlyMode(dashboardValues) {
  return !!dashboardValues?.grafanaURL && !dashboardValues?.prometheusURL && !dashboardValues?.alertmanagerURL;
}

async function hasEndpointSubsets(store, id) {
  if (store.getters['cluster/schemaFor'](ENDPOINTS)) {
    const endpoints = await store.dispatch('cluster/findAll', { type: ENDPOINTS }) || [];

    const endpoint = endpoints.find((ep) => ep.id === id);

    return !!endpoint && !isEmpty(endpoint) && !isEmpty(endpoint.subsets);
  }

  return false;
}

export async function hasGrafanaEndpoint(store) {
  return await hasEndpointSubsets(store, `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-grafana`);
}

export async function hasAlertManagerEndpoint(store) {
  return await hasEndpointSubsets(store, `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-alertmanager`);
}

export async function hasPrometheusEndpoint(store) {
  return await hasEndpointSubsets(store, `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-prometheus`);
}

export async function canViewGrafanaLink(store, dashboardValues) {
  const values = dashboardValues ?? await getClusterMonitoringDashboardValues(store);

  return !!values.grafanaURL || await hasGrafanaEndpoint(store);
}

export async function canViewAlertManagerLink(store, dashboardValues) {
  const values = dashboardValues ?? await getClusterMonitoringDashboardValues(store);

  return !!values.alertmanagerURL || await hasAlertManagerEndpoint(store);
}

export async function canViewPrometheusLink(store, dashboardValues) {
  const values = dashboardValues ?? await getClusterMonitoringDashboardValues(store);

  return !!values.prometheusURL || await hasPrometheusEndpoint(store);
}

// Other ways we check for monitoring:

// (1) Using counts (requires RBAC permissions)
// return !!this.clusterCounts?.[0]?.counts?.[CATALOG.APP]?.namespaces?.['cattle-monitoring-system'];

// (2) Retrieving all workloads and looking for containers with a given image
// See chart/monitoring/index.vue
