/**
 * Reading a value out of a row for a table column.
 *
 * Shared, because two places need it and they must not disagree: the table draws a cell from it,
 * and table views filter, group and export by it. A column whose group-by heading says one thing
 * while the cell under it says another is what two implementations of this look like.
 */

import { get } from '@shell/utils/object';
import type { TableViewColumn, TableViewRow } from '@shell/types/table-views';

interface ValueForOptions {
  /**
   * Whether a column with no path at all is worth complaining about. True for a table drawing a
   * cell, where it means a broken column definition; false for a caller that is asking about
   * every column it has and expects some to have nothing to give.
   */
  warn?: boolean;
}

/**
 * The value a column holds for a row: what the table would show there, before any formatter.
 *
 * `isLabel` is for the label columns a table view adds, which are read off the row's metadata
 * rather than by a path.
 */
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
