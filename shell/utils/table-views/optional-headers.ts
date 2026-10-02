import type { HeaderOptions, PaginationHeaderOptions } from '@shell/core/types';
import { FLEET, MANAGEMENT } from '@shell/config/types';
import {
  AGE, AUTOSCALER_ENABLED, FLEET_GIT_REPO_COMMIT, MGMT_CLUSTER_CPU, MGMT_CLUSTER_MACHINES, MGMT_CLUSTER_MEMORY, MGMT_CLUSTER_PODS
} from '@shell/config/table-headers';
import {
  STEVE_AGE_COL, STEVE_AUTOSCALER_ENABLED, STEVE_MGMT_CLUSTER_CPU, STEVE_MGMT_CLUSTER_MACHINES, STEVE_MGMT_CLUSTER_MEMORY, STEVE_MGMT_CLUSTER_PODS
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
