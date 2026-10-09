import type { RouteLocationRaw } from 'vue-router';
import type { StateColor } from '@shell/utils/style';

/**
 * After typing when should we kick off a request
 */
export const WORKLOAD_SEARCH_DEBOUNCE_MS = 300;
/**
 * how many workloads to show in the drop down, per type, before we show 'more resource' button
 */
export const WORKLOAD_SEARCH_RESULTS_PER_TYPE = 7;

export interface WorkloadSearchOption {
  /**
   * Set on group header (by-type) options and the trailing "+X more" row;
   * omitted on real, selectable options.
   */
  kind?: 'group' | 'more';
  label: string;
  uniqueId: string;
  namespace?: string;
  value?: RouteLocationRaw;
  /** State color used to render the state dot; omitted on group header options. */
  color?: StateColor;
  /** The underlying resource, passed to the row's action menu; omitted on group header options. */
  resource?: Record<string, any>;
  /** The resource type this result set was fetched for; only set on kind: 'more' options. */
  resourceType?: string;
  /** The search term that produced this result set; only set on kind: 'more' options. */
  searchTerm?: string;
}
