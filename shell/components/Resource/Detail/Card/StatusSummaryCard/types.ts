import type { RouteLocationRaw } from 'vue-router';
import type { StateColor } from '@shell/utils/style';

/** One state's contribution to the card: a coloured indicator, a label and a count. */
export interface StatusSummaryRow {
  label: string;
  color: StateColor;
  count: number;
  /** Usually the resource list filtered to this state. */
  to?: RouteLocationRaw;
}

/** One coloured slice of the card's stacked status bar. */
export interface StatusSummarySegment {
  color: StateColor;
  percent: number;
}

export interface StatusSummaryCardProps {
  title: string;
  total: number;
  segments: StatusSummarySegment[];
  rows: StatusSummaryRow[];
  /** Where a plain click on the card goes, usually the unfiltered resource list. */
  to?: RouteLocationRaw;
}

/** A card as listed by StatusSummaryCardSection. `key` must be unique within the section. */
export interface StatusSummaryCardItem extends StatusSummaryCardProps {
  key: string;
}
