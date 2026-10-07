import type { HeaderOptions, PaginationHeaderOptions } from '@shell/core/types';
import { MANAGEMENT } from '@shell/config/types';
import { AUTOSCALER_ENABLED, MGMT_CLUSTER_CPU, MGMT_CLUSTER_MEMORY, MGMT_CLUSTER_PODS } from '@shell/config/table-headers';
import { STEVE_AUTOSCALER_ENABLED, STEVE_MGMT_CLUSTER_CPU, STEVE_MGMT_CLUSTER_MEMORY, STEVE_MGMT_CLUSTER_PODS } from '@shell/config/pagination-table-headers';
import { isAutoscalerFeatureFlagEnabled } from '@shell/utils/autoscaler-utils';
import type { GetterSource } from '@shell/utils/table-views/feature';

/**
 * Columns a type offers that not every list of it shows, eg the autoscaler column, so the column
 * menu can add them anywhere
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
      header: MGMT_CLUSTER_CPU, paginationHeader: STEVE_MGMT_CLUSTER_CPU, before: 'summary'
    },
    {
      header: MGMT_CLUSTER_MEMORY, paginationHeader: STEVE_MGMT_CLUSTER_MEMORY, before: 'summary'
    },
    {
      header: MGMT_CLUSTER_PODS, paginationHeader: STEVE_MGMT_CLUSTER_PODS, before: 'summary'
    },
    {
      header:           AUTOSCALER_ENABLED,
      paginationHeader: STEVE_AUTOSCALER_ENABLED,
      enabled:          (store) => isAutoscalerFeatureFlagEnabled(store),
      before:           'summary',
    },
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
