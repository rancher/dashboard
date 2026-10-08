import type { RouteLocationRaw } from 'vue-router';
import type { StateColor } from '@shell/utils/style';

export interface StatusBreakdownCount {
  color: StateColor;
  count: number;
  to?: RouteLocationRaw;
}

export interface StatusBreakdownRow {
  key: string;
  label: string;
  to?: RouteLocationRaw;
  /** One entry per color, so the color is unique within the row */
  counts: StatusBreakdownCount[];
}

export interface StatusBreakdownCardProps {
  title: string;
  rows: StatusBreakdownRow[];
  /** Make the whole card clickable. A plain click or enter outside the links emits `select` */
  selectable?: boolean;
}

/** A card as listed by a section. `key` must be unique within the section. */
export interface StatusBreakdownCardItem extends StatusBreakdownCardProps {
  key: string;
}
