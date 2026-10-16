/** Shared by the table's cells and table views, so a group heading can't disagree with its cells */

import { get } from '@shell/utils/object';
import type { TableViewColumn, TableViewRow } from '@shell/types/table-views';

interface ValueForOptions {
  /** Off for callers that ask about every column, where some genuinely have no path */
  warn?: boolean;
}

export function valueFor(row: TableViewRow, col: TableViewColumn, isLabel?: boolean, { warn = true }: ValueForOptions = {}): unknown {
  if (typeof col?.value === 'function') {
    return col.value(row);
  }

  if (isLabel) {
    const labels = row?.metadata?.labels;

    if (col.label && labels?.[col.label]) {
      return labels[col.label];
    }

    return '';
  }

  const expr = col?.value || col?.name;

  if (!expr) {
    if (warn) {
      console.error('No path has been defined for this column, unable to get value of cell', col); // eslint-disable-line no-console
    }

    return '';
  }

  const out = get(row, expr);

  if (out === null || out === undefined) {
    return '';
  }

  return out;
}
