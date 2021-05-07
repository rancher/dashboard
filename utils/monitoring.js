// Helpers for determining if V2 or v1 Monitoring are installed

import { SCHEMA, MONITORING } from '@/config/types';
import { normalizeType } from '@/plugins/steve/normalize';
import { findBy } from '@/utils/array';

// Can be used inside a compoennts' computed property
export function monitoringStatus() {
  return {
    monitoringStatus() {
      const status = {
        v1: haveV1Monitoring(this.$store.getters),
        v2: haveV2Monitoring(this.$store.getters),
      };

      status.installed = status.v1 || status.v2;

      return status;
    }
  };
}

export function haveV2Monitoring(getters) {
  // Can't have V2 and V1 monitoring installed, so if V1 is installed we know v2 is not
  if (haveV1Monitoring(getters)) {
    return false;
  }

  // Just check for the pod monitors CRD
  const schemas = getters[`cluster/all`](SCHEMA);
  const exists = findBy(schemas, 'id', normalizeType(MONITORING.PODMONITOR));

  return !!exists;
}

// For v1 Monitoring, the cluster object indicates presence via status.monitoringStatus
export function haveV1Monitoring(getters) {
  const cluster = getters['currentCluster'];

  return !!cluster?.status?.monitoringStatus;
}

// Other ways we check for monitoring:

// (1) Using counts (requires RBAC permissinons)
// return !!this.clusterCounts?.[0]?.counts?.[CATALOG.APP]?.namespaces?.['cattle-monitoring-system'];

// (2) Retrieving all workloads and looking for containers with a given image
// See chart/monitoring/index.vue
