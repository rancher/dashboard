import { MANAGEMENT } from '@shell/config/types';
import { AUTOSCALER_ENABLED, MGMT_CLUSTER_CPU, MGMT_CLUSTER_MEMORY, MGMT_CLUSTER_PODS } from '@shell/config/table-headers';
import { STEVE_AUTOSCALER_ENABLED, STEVE_MGMT_CLUSTER_CPU, STEVE_MGMT_CLUSTER_MEMORY, STEVE_MGMT_CLUSTER_PODS } from '@shell/config/pagination-table-headers';
import { isAutoscalerFeatureFlagEnabled } from '@shell/utils/autoscaler-utils';

/**
 * Columns a resource type HAS without every list of it showing them.
 *
 * A page's headers say what it shows by default. That is not the same as what the type offers:
 * the Autoscaler column belongs to a cluster wherever it is listed, but only Cluster Management
 * puts it on screen, so nowhere else could even add it. Registering it here lets the column
 * menu offer it everywhere while leaving each page's default columns exactly as they were.
 *
 * `enabled` is what keeps this from being a plain list: a column can be conditional - the
 * autoscaler one is behind a feature flag - and the condition has to travel with it rather than
 * being reapplied by every page that offers the column.
 */
interface OptionalHeader {
  /** The column as an unpaginated list wants it */
  header: any;
  /** The same column for a server side paginated list, when it differs */
  paginationHeader?: any;
  /** Whether this column is available at all right now */
  enabled?: (store: any) => boolean;
  /**
   * Name of the column this one goes in front of, so it lands where the list that shows it by
   * default puts it rather than on the end. Ignored when that column is not there.
   */
  before?: string;
}

const OPTIONAL_HEADERS: Record<string, OptionalHeader[]> = {
  // Listed in the order the home page shows them, so a list adding them all ends up with the
  // same column order it has there
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
      enabled:          (store: any) => isAutoscalerFeatureFlagEnabled(store),
      // Where Cluster Management puts it: straight after the version, in front of the machine
      // summary. Landing on the end instead read as an afterthought rather than a cluster column.
      before:           'summary',
    },
  ],
};

/**
 * The columns this type offers beyond whatever the page itself shows
 */
export function optionalHeadersFor(type: string, store: any, pagination = false): any[] {
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
