// Helpers for determining if V2 or v1 Monitoring are installed

import {
  CATALOG,
  COUNT,
  ENDPOINTS,
  MONITORING,
  SCHEMA
} from '@shell/config/types';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { findBy } from '@shell/utils/array';
import { isEmpty } from '@shell/utils/object';

export const CATTLE_MONITORING_NAMESPACE = 'cattle-monitoring-system';

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

  // Just check for the pod monitors CRD
  const schemas = getters[`${ inStore }/all`](SCHEMA);
  const exists = findBy(schemas, 'id', normalizeType(MONITORING.PODMONITOR));
  const counts = getters[`${ inStore }/all`](COUNT)?.[0]?.counts || {};
  const monitoringApps = counts?.[CATALOG.APP]?.namespaces?.[CATTLE_MONITORING_NAMESPACE];

  return !!exists || !!monitoringApps;
}

export async function getMonitoringApp(store, storeName = 'cluster') {
  if (!store.getters[`${ storeName }/canList`](CATALOG.APP)) {
    return null;
  }

  try {
    return await store.dispatch(`${ storeName }/find`, {
      type: CATALOG.APP,
      id:   `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring`
    });
  } catch {
    return null;
  }
}

export function getMonitoringDashboardValues(monitoringApp) {
  return monitoringApp?.status?.dashboardValues || {};
}

async function hasEndpointSubsets(store, id) {
  if (store.getters['cluster/schemaFor'](ENDPOINTS)) {
    const endpoints = await store.dispatch('cluster/findAll', { type: ENDPOINTS }) || [];

    const endpoint = endpoints.find((ep) => ep.id === id);

    return endpoint && !isEmpty(endpoint) && !isEmpty(endpoint.subsets);
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

export async function canViewGrafanaLink(store) {
  const monitoringApp = await getMonitoringApp(store);
  const dashboardValues = getMonitoringDashboardValues(monitoringApp);

  return !!dashboardValues.grafanaURL || await hasGrafanaEndpoint(store);
}

export async function canViewAlertManagerLink(store) {
  return await hasAlertManagerEndpoint(store);
}

export async function canViewPrometheusLink(store) {
  return await hasPrometheusEndpoint(store);
}

// Other ways we check for monitoring:

// (1) Using counts (requires RBAC permissions)
// return !!this.clusterCounts?.[0]?.counts?.[CATALOG.APP]?.namespaces?.['cattle-monitoring-system'];

// (2) Retrieving all workloads and looking for containers with a given image
// See chart/monitoring/index.vue
