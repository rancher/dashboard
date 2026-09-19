import type { RouteLocationRaw } from 'vue-router';

export const WORKLOAD_SEARCH_DEBOUNCE_MS = 300;
export const WORKLOAD_SEARCH_RESULTS_PER_TYPE = 10;

export interface WorkloadSearchOption {
  /** Set on group header (by-type) options; omitted on real, selectable options. */
  kind?: 'group';
  label: string;
  uniqueId: string;
  namespace?: string;
  value?: RouteLocationRaw;
}
