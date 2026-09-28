/**
 * Table Views - saved views.
 *
 * A view is a filter query, a set of columns and a group by, kept per user and per resource
 * type. Here is what one holds, whether two of them are the same, and which one a tab bar should
 * light up.
 */

import isEqual from 'lodash/isEqual';

import type { TableViewSaved, TableViewState } from '@shell/types/table-views';

/**
 * What a view holds, and what each of those means when it holds nothing.
 *
 * Every key of {@link TableViewState} has to appear: the type makes that a compile error rather than
 * a silent omission, and an omission here would mean a view that has been changed still reading
 * as saved. The empties are what make the comparison lenient - a saved view holds
 * `columns: null` where a view being edited holds `undefined`, and an untouched `labelColumns`
 * is `[]` in one and missing in the other. Same view, written down by two pieces of code.
 */
const EMPTY_VIEW: Required<TableViewState> = {
  query:          '',
  groupBy:        null,
  sort:           null,
  sortDescending: false,
  columns:        null,
  columnOrder:    null,
  labelColumns:   [],
};

/** A view reduced to what it means, so two of them can be compared as values */
function comparable(view: Partial<TableViewState>): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  (Object.keys(EMPTY_VIEW) as (keyof TableViewState)[]).forEach((key) => {
    out[key] = view[key] ?? EMPTY_VIEW[key];
  });

  return out;
}

/**
 * Do these two hold the same view? By what they hold rather than by who they are, so a saved
 * view can be recognised in whatever is currently applied.
 */
function isSameViewConfig(a: Partial<TableViewState>, b: Partial<TableViewState>): boolean {
  return isEqual(comparable(a), comparable(b));
}

/** Has anything at all been asked of the table, or is this the list as it comes? */
function isViewModified(view: Partial<TableViewState>): boolean {
  return !!view.query || !!view.groupBy || !!view.columns || !!view.labelColumns?.length ||
    !!view.columnOrder || !!view.sort;
}

/** Which saved view (if any) the state in front of the user matches */
function matchingViewId(savedViews: TableViewSaved[], view: Partial<TableViewState>): string | null {
  return savedViews.find((saved) => isSameViewConfig(saved, view))?.id || null;
}

/**
 * Which saved view a tab bar shows as selected.
 *
 * `pickedViewId` is the tab the user picked: `undefined` if nothing has been picked yet, `null`
 * for the table's own tab, or the id of a saved view. A list that opens on the user's default
 * view starts with that view picked.
 *
 * The view the user picked wins. Two saved views can hold the same config, and matching on
 * config alone would always light up the first of them - so picking the second looked like
 * nothing happened. Only before anything is picked does the config decide, so changes made on a
 * list that opened with no view picked light up the saved view they amount to.
 */
export function selectedViewIdFor(savedViews: TableViewSaved[], view: Partial<TableViewState>, pickedViewId?: string | null): string | null {
  if (pickedViewId !== undefined) {
    if (pickedViewId === null) {
      return null;
    }

    return savedViews.find((v) => v.id === pickedViewId)?.id || matchingViewId(savedViews, view);
  }

  return isViewModified(view) ? matchingViewId(savedViews, view) : null;
}

/** Unsaved changes: either edits on top of a saved view, or an unsaved view of one's own */
export function isViewDirty(savedViews: TableViewSaved[], view: Partial<TableViewState>, pickedViewId?: string | null): boolean {
  const editing = pickedViewId ? savedViews.find((v) => v.id === pickedViewId) : null;

  if (editing) {
    return !isSameViewConfig(editing, view);
  }

  if (pickedViewId === null) {
    return isViewModified(view);
  }

  return !matchingViewId(savedViews, view) && isViewModified(view);
}

/**
 * `order` with the entry at `from` lifted out and put back at `to`.
 *
 * Both reorder drags splice their own copy of this - the column picker's rows and the view tabs -
 * and getting it subtly different in one of them is how a list ends up dropping an entry.
 */
export function moveInOrder<T>(order: T[], from: number, to: number): T[] {
  const next = [...order];

  if (from < 0 || to < 0 || from >= next.length || from === to) {
    return next;
  }

  next.splice(to, 0, ...next.splice(from, 1));

  return next;
}
