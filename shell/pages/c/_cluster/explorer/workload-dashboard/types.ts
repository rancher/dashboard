import { WORKLOAD_TYPES, POD } from '@shell/config/types';
import type { StateColor } from '@shell/utils/style';
import type { RouteLocationRaw } from 'vue-router';

export interface WorkloadDashboardSummaryEntry {
  type: string;
  summary: { property: string; counts: Record<string, number> }[] | null;
  error: string | null;
}

export interface WorkloadDashboardEntry {
  type: string;
  label: string;
  total: number;
  stateCounts: Record<string, number>;
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
  heroMode: 'default' | 'full' | 'wide';
  gridRows: number;
}

export interface WorkloadDashboardByTypeCard {
  title: string;
  type: string;
  resources: {
    stateDisplay: string;
    stateId: string;
    stateSimpleColor: StateColor;
    count: number;
  }[];
}

export type WorkloadDashboardResourceRouteFn = (type: string, stateNames?: string[]) => RouteLocationRaw;

export const WORKLOAD_RESOURCE_TYPES: string[] = [
  WORKLOAD_TYPES.CRON_JOB,
  WORKLOAD_TYPES.DAEMON_SET,
  WORKLOAD_TYPES.DEPLOYMENT,
  WORKLOAD_TYPES.JOB,
  WORKLOAD_TYPES.STATEFUL_SET,
  POD,
];

export const COLOR_ORDER: Record<string, number> = {
  error: 0, warning: 1, disabled: 2, info: 3, success: 4
};
