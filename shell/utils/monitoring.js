// Helpers for determining if V2 or v1 Monitoring are installed

import { SCHEMA, MONITORING, ENDPOINTS } from '@shell/config/types';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { findBy } from '@shell/utils/array';
import { isEmpty } from '@shell/utils/object';

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

  return !!exists;
}

export const CATTLE_MONITORING_NAMESPACE = 'cattle-monitoring-system';

async function hasEndpointSubsets(store, id) {
  if (store.getters['cluster/schemaFor'](ENDPOINTS)) {
    const endpoints = await store.dispatch('cluster/findAll', { type: ENDPOINTS }) || [];

    const endpoint = endpoints.find((ep) => ep.id === id);

    return endpoint && !isEmpty(endpoint) && !isEmpty(endpoint.subsets);
  }

  return false;
}

export async function canViewGrafanaLink(store) {
  return await hasEndpointSubsets(store, `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-grafana`);
}

export async function canViewAlertManagerLink(store) {
  return await hasEndpointSubsets(store, `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-alertmanager`);
}

export async function canViewPrometheusLink(store) {
  return await hasEndpointSubsets(store, `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-prometheus`);
}

// Other ways we check for monitoring:

// (1) Using counts (requires RBAC permissions)
// return !!this.clusterCounts?.[0]?.counts?.[CATALOG.APP]?.namespaces?.['cattle-monitoring-system'];

// (2) Retrieving all workloads and looking for containers with a given image
// See chart/monitoring/index.vue
