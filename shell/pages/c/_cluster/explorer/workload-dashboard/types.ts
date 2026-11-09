import { WORKLOAD_TYPES, POD } from '@shell/config/types';
import type { StateColor } from '@shell/utils/style';
import type { RouteLocationRaw } from 'vue-router';

export type WorkloadDashboardStateCounts = Record<string, { total: number; namespace: Record<string, number> }>;

export interface WorkloadDashboardFlaggedCounts {
  color: StateColor;
  counts: WorkloadDashboardStateCounts;
}

export interface WorkloadDashboardSummaryEntry {
  type: string;
  summary: { property: string; counts: WorkloadDashboardStateCounts }[] | null;
  /**
   * Counts of the resources in error and of those transitioning, by the color they are shown in. Null for
   * types not in WORKLOAD_DASHBOARD_STATE_FLAG_TYPES and when they could not be fetched
   */
  flaggedCounts: WorkloadDashboardFlaggedCounts[] | null;
  error: string | null;
}

export interface WorkloadDashboardStateCount {
  name: string;
  color: StateColor;
  count: number;
  namespace: Record<string, number>;
}

export interface WorkloadDashboardEntry {
  type: string;
  label: string;
  total: number;
  states: WorkloadDashboardStateCount[];
  error: string | null;
}

export interface WorkloadDashboardStateCardRow {
  label: string;
  color: StateColor;
  type: string;
  stateNames: string[];
  counts: { label: string; count: number }[];
}

export interface WorkloadDashboardStateCard {
  color: StateColor;
  rows: WorkloadDashboardStateCardRow[];
}

export interface WorkloadDashboardByStateLayout {
  hero: WorkloadDashboardStateCard | null;
  subHero: WorkloadDashboardStateCard | null;
  cards: WorkloadDashboardStateCard[];
}

export type WorkloadDashboardResourceRouteFn = (type: string, stateNames?: string[], nameFilter?: string) => RouteLocationRaw;

export type WorkloadDashboardFilterByNamespaceFn = (namespace: string) => void;

export type WorkloadDashboardNamespaceNavigateFn = (type: string, namespace: string) => void;

export const WORKLOAD_DASHBOARD_RESOURCE_TYPES: string[] = [
  WORKLOAD_TYPES.CRON_JOB,
  WORKLOAD_TYPES.DAEMON_SET,
  WORKLOAD_TYPES.DEPLOYMENT,
  WORKLOAD_TYPES.JOB,
  WORKLOAD_TYPES.REPLICA_SET,
  WORKLOAD_TYPES.STATEFUL_SET,
  POD,
];

/**
 * Workload types whose resources can be filtered by `metadata.state.error` and `metadata.state.transitioning`
 */
export const WORKLOAD_DASHBOARD_STATE_FLAG_TYPES: string[] = [
  WORKLOAD_TYPES.JOB,
  POD,
];
