import { WORKLOAD_TYPES, POD } from '@shell/config/types';
import { StateColor } from '@shell/utils/style';
import type { RouteLocationRaw } from 'vue-router';

export interface SummaryEntry {
  type: string;
  summary: { property: string; counts: Record<string, number> }[] | null;
  error: string | null;
}

export interface WorkloadEntry {
  type: string;
  label: string;
  total: number;
  stateCounts: Record<string, number>;
  error: string | null;
}

export interface StateCardRow {
  label: string;
  color: StateColor;
  type: string;
  stateNames: string[];
  counts: { label: string; count: number }[];
}

export interface StateCard {
  color: StateColor;
  rows: StateCardRow[];
}

export interface ByStateLayout {
  hero: StateCard | null;
  subHero: StateCard | null;
  cards: StateCard[];
  heroMode: string;
  gridRows: number;
}

export interface ByTypeCard {
  title: string;
  type: string;
  resources: {
    stateDisplay: string;
    stateId: string;
    stateSimpleColor: StateColor;
    count: number;
  }[];
}

export type ResourceRouteFn = (type: string, stateNames?: string[]) => RouteLocationRaw;

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
