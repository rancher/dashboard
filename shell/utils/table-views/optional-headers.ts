import type { HeaderOptions, PaginationHeaderOptions } from '@shell/core/types';
import {
  BACKUP_RESTORE, CATALOG, CONFIG_MAP, FLEET, HPA, INGRESS, LOGGING, MANAGEMENT, MONITORING, NAMESPACE, NETWORK_POLICY, NODE, POD,
  POD_DISRUPTION_BUDGET, PV, PVC, SECRET, SERVICE, SERVICE_ACCOUNT, STORAGE_CLASS, WORKLOAD_TYPES
} from '@shell/config/types';
import {
  AGE, AUTOSCALER_ENABLED, DESCRIPTION_ANNOTATION_COL, FLEET_GIT_REPO_COMMIT, MGMT_CLUSTER_CPU, MGMT_CLUSTER_MACHINES, MGMT_CLUSTER_MEMORY,
  MGMT_CLUSTER_PODS
} from '@shell/config/table-headers';
import {
  STEVE_AGE_COL, STEVE_AUTOSCALER_ENABLED, STEVE_DESCRIPTION_ANNOTATION_COL, STEVE_MGMT_CLUSTER_CPU, STEVE_MGMT_CLUSTER_MACHINES,
  STEVE_MGMT_CLUSTER_MEMORY, STEVE_MGMT_CLUSTER_PODS
} from '@shell/config/pagination-table-headers';
import { isAutoscalerFeatureFlagEnabled } from '@shell/utils/autoscaler-utils';
import type { GetterSource } from '@shell/utils/table-views/feature';

/**
 * Columns a type offers that not every list of it shows, eg the autoscaler column, so the column
 * menu can add them anywhere. Only these are offered beyond a list's own: a list that names its
 * columns has chosen them, and the type's other columns can repeat or contradict its own
 */
interface OptionalHeader {
  header: HeaderOptions;
  paginationHeader?: PaginationHeaderOptions;
  enabled?: (store: GetterSource) => boolean;
  /** The column this one goes in front of, when it is there */
  before?: string;
}

const DESCRIPTION_COLUMN: OptionalHeader = { header: DESCRIPTION_ANNOTATION_COL, paginationHeader: STEVE_DESCRIPTION_ANNOTATION_COL };

/** Types whose edit forms keep a description in its annotation; others keep it elsewhere, or have none */
const DESCRIBED_TYPES = [
  CONFIG_MAP, SECRET, SERVICE, SERVICE_ACCOUNT, NODE, NAMESPACE, PV, PVC, STORAGE_CLASS, POD_DISRUPTION_BUDGET, HPA, INGRESS, NETWORK_POLICY,
  WORKLOAD_TYPES.DEPLOYMENT, WORKLOAD_TYPES.STATEFUL_SET, WORKLOAD_TYPES.DAEMON_SET, WORKLOAD_TYPES.JOB, WORKLOAD_TYPES.CRON_JOB, POD,
  FLEET.GIT_REPO, FLEET.HELM_OP, FLEET.CLUSTER, FLEET.CLUSTER_GROUP, FLEET.POLICY, FLEET.WORKSPACE,
  CATALOG.CLUSTER_REPO, BACKUP_RESTORE.BACKUP, LOGGING.FLOW, LOGGING.CLUSTER_FLOW, LOGGING.OUTPUT, LOGGING.CLUSTER_OUTPUT,
  MONITORING.ALERTMANAGERCONFIG, MONITORING.PROMETHEUSRULE,
];

const OPTIONAL_HEADERS: Record<string, OptionalHeader[]> = {
  [MANAGEMENT.CLUSTER]: [
    {
      header: MGMT_CLUSTER_CPU, paginationHeader: STEVE_MGMT_CLUSTER_CPU, before: 'machines'
    },
    {
      header: MGMT_CLUSTER_MEMORY, paginationHeader: STEVE_MGMT_CLUSTER_MEMORY, before: 'machines'
    },
    {
      header: MGMT_CLUSTER_PODS, paginationHeader: STEVE_MGMT_CLUSTER_PODS, before: 'machines'
    },
    {
      header:           AUTOSCALER_ENABLED,
      paginationHeader: STEVE_AUTOSCALER_ENABLED,
      enabled:          (store) => isAutoscalerFeatureFlagEnabled(store),
      before:           'machines',
    },
    // Home and Cluster Management list the same clusters, so each offers what the other shows
    { header: MGMT_CLUSTER_MACHINES, paginationHeader: STEVE_MGMT_CLUSTER_MACHINES },
    { header: AGE, paginationHeader: STEVE_AGE_COL },
  ],
  [FLEET.GIT_REPO]: [
    // The commit deployed, which the list doesn't show
    { header: FLEET_GIT_REPO_COMMIT },
  ],
};

DESCRIBED_TYPES.forEach((type) => {
  OPTIONAL_HEADERS[type] = (OPTIONAL_HEADERS[type] || []).concat([DESCRIPTION_COLUMN]);
});

export function optionalHeadersFor(
  type: string,
  store: GetterSource,
  pagination = false
): (HeaderOptions & { insertBefore?: string })[] {
  const entries = OPTIONAL_HEADERS[type];

  if (!entries?.length) {
    return [];
  }

  return entries
    .filter((entry) => !entry.enabled || entry.enabled(store))
    .map((entry) => {
      const header = pagination && entry.paginationHeader ? entry.paginationHeader : entry.header;

      return entry.before ? { ...header, insertBefore: entry.before } : header;
    });
}
