// Helpers for determining if V2 or v1 Monitoring are installed

import {
  CATALOG,
  COUNT,
  MONITORING,
  SCHEMA
} from '@shell/config/types';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { findBy } from '@shell/utils/array';

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

  // Check for the rancher-monitoring app directly - works for dashboard-only installs that ship no CRDs.
  const apps = getters[`${ inStore }/all`](CATALOG.APP) || [];
  const counts = getters[`${ inStore }/all`](COUNT)?.[0]?.counts || {};
  const monitoringAppId = `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring`;

  if (counts?.[CATALOG.APP]?.namespaces?.[CATTLE_MONITORING_NAMESPACE] || findBy(apps, 'id', monitoringAppId)) {
    return true;
  }

  // Fall back to the legacy CRD signal for older installs.
  const schemas = getters[`${ inStore }/all`](SCHEMA);
  const exists = findBy(schemas, 'id', normalizeType(MONITORING.PODMONITOR));

  return !!exists;
}

export async function canViewGrafanaLink(_store) {
  return true;
}

export async function canViewAlertManagerLink(_store) {
  return true;
}

export async function canViewPrometheusLink(_store) {
  return true;
}

// Other ways we check for monitoring:

// (1) Using counts (requires RBAC permissions)
// return !!this.clusterCounts?.[0]?.counts?.[CATALOG.APP]?.namespaces?.['cattle-monitoring-system'];

// (2) Retrieving all workloads and looking for containers with a given image
// See chart/monitoring/index.vue
