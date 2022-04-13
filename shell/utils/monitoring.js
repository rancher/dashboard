// Helpers for determining if V2 or v1 Monitoring are installed

import { SCHEMA, MONITORING, WORKLOAD_TYPES } from '@shell/config/types';
import { normalizeType } from '@shell/plugins/steve/normalize';
import { findBy } from '@shell/utils/array';
import { isEmpty } from '@shell/utils/object';

// Can be used inside a components' computed property
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

const CATTLE_MONITORING_NAMESPACE = 'cattle-monitoring-system';

export async function haveV1MonitoringWorkloads(store) {
  const workloadsByType = await Promise.all(
    Object.values(WORKLOAD_TYPES).map(type => store.dispatch('cluster/findAll', { type })
    )
  );
  const workloads = workloadsByType.flat();

  for (let i = 0; i < workloads.length; i++) {
    const workload = workloads[i];

    if (!isEmpty(workload?.spec?.template?.spec?.containers) &&
        workload.spec.template.spec.containers.find(c => c.image?.includes('quay.io/coreos/prometheus-operator') ||
          c.image?.includes('rancher/coreos-prometheus-operator')) &&
        workload?.metadata?.namespace !== CATTLE_MONITORING_NAMESPACE) {
      return Promise.resolve(true);
    }

    return Promise.resolve(false);
  }
}

// Other ways we check for monitoring:

// (1) Using counts (requires RBAC permissions)
// return !!this.clusterCounts?.[0]?.counts?.[CATALOG.APP]?.namespaces?.['cattle-monitoring-system'];

// (2) Retrieving all workloads and looking for containers with a given image
// See chart/monitoring/index.vue
