/**
 * Table Views - saved views.
 *
 * A view is a filter query, a set of columns and a group by, kept per user and per resource
 * type. Here is what one holds, whether two of them are the same, which one a tab bar should
 * light up, and how one travels in a url.
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
export function isSameViewConfig(a: Partial<TableViewState>, b: Partial<TableViewState>): boolean {
  return isEqual(comparable(a), comparable(b));
}

/** Has anything at all been asked of the table, or is this the list as it comes? */
export function isViewModified(view: Partial<TableViewState>): boolean {
  return !!view.query || !!view.groupBy || !!view.columns || !!view.labelColumns?.length ||
    !!view.columnOrder || !!view.sort;
}

/** Which saved view (if any) the state in front of the user matches */
export function matchingViewId(savedViews: TableViewSaved[], view: Partial<TableViewState>): string | null {
  return savedViews.find((saved) => isSameViewConfig(saved, view))?.id || null;
}

/**
 * Which saved view a tab bar shows as selected.
 *
 * `pickedViewId` is the tab the user picked: `undefined` if nothing has been picked yet, `null`
 * for the table's own tab, or the id of a saved view.
 *
 * The view the user picked wins. Two saved views can hold the same config, and matching on
 * config alone would always light up the first of them - so picking the second looked like
 * nothing happened. Fall back to the config when nothing has been picked, so a view arriving in
 * the URL still shows as selected.
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

/**
 * Encode a view so it can be dropped in a url and shared with someone else
 */
export function encodeView(view: Partial<TableViewSaved>): string {
  const payload = JSON.stringify({
    n: view.name || '',
    q: view.query || '',
    c: view.columns || null,
    o: view.columnOrder || null,
    l: view.labelColumns || [],
    g: view.groupBy || null,
  });

  try {
    return window.btoa(encodeURIComponent(payload));
  } catch (e) {
    return '';
  }
}

export function decodeView(encoded: string): Partial<TableViewSaved> | null {
  if (!encoded) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeURIComponent(window.atob(encoded)));

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return null;
    }

    // Every field is checked rather than taken. This arrives in a url that someone else wrote, and
    // what comes out of it is applied to the toolbar and can be saved as the user's own view - so
    // anything that is not the shape it claims to be is dropped rather than carried inwards.
    const str = (v: unknown): string => (typeof v === 'string' ? v : '');
    const strOrNull = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
    const strList = (v: unknown): string[] | null => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : null);

    return {
      name:         str(payload.n),
      query:        str(payload.q),
      columns:      strList(payload.c),
      columnOrder:  strList(payload.o),
      labelColumns: strList(payload.l) || [],
      groupBy:      strOrNull(payload.g),
    };
  } catch (e) {
    return null;
  }
}
