
import isEqual from 'lodash/isEqual';

import type { TableViewSaved, TableViewState } from '@shell/types/table-views';

/** What a view stores to turn off the grouping its table groups by by default */
export const NO_GROUPING = 'none';

/** Goes up when the saved views preference changes shape, so a release reading an older one can convert it */
export const SAVED_VIEWS_VERSION = 1;

export interface SavedViewsPref<T> {
  metadata: {
    version: number;
    /** A random key that tells the user's own table links apart from others' - see useTableViewsLink */
    persistenceId?: string;
  };
  payload: Record<string, T>;
}

/** The saved views by resource type, from the preference as written, or as it was before it had a version */
export function savedViewsByType<T>(stored: unknown): Record<string, T> {
  if (!stored || typeof stored !== 'object') {
    return {};
  }

  const wrapped = stored as Partial<SavedViewsPref<T>>;

  if (wrapped.metadata && typeof wrapped.metadata === 'object' && 'payload' in wrapped) {
    return wrapped.payload || {};
  }

  return stored as Record<string, T>;
}

export function savedViewsPref<T>(byType: Record<string, T>, persistenceId?: string | null): SavedViewsPref<T> {
  const metadata: SavedViewsPref<T>['metadata'] = { version: SAVED_VIEWS_VERSION };

  if (persistenceId) {
    metadata.persistenceId = persistenceId;
  }

  return { metadata, payload: byType };
}

/** The persistence id the preference holds, if it has one yet */
export function persistenceIdOf(stored: unknown): string | null {
  const id = (stored as Partial<SavedViewsPref<unknown>> | null)?.metadata?.persistenceId;

  return typeof id === 'string' && id ? id : null;
}

/** Each key's empty value, so `null`, `undefined` and `[]` compare as the same */
const EMPTY_VIEW: Required<TableViewState> = {
  query:          '',
  groupBy:        null,
  sort:           null,
  sortDescending: false,
  columns:        null,
  columnOrder:    null,
  labelColumns:   [],
};

function comparable(view: Partial<TableViewState>): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  (Object.keys(EMPTY_VIEW) as (keyof TableViewState)[]).forEach((key) => {
    out[key] = view[key] ?? EMPTY_VIEW[key];
  });

  return out;
}

function isSameViewConfig(a: Partial<TableViewState>, b: Partial<TableViewState>): boolean {
  return isEqual(comparable(a), comparable(b));
}

/** Whether a view differs from the table as it comes */
export function isViewModified(view: Partial<TableViewState>): boolean {
  return !!view.query || !!view.groupBy || !!view.columns || !!view.labelColumns?.length ||
    !!view.columnOrder || !!view.sort;
}

function matchingViewId(savedViews: TableViewSaved[], view: Partial<TableViewState>): string | null {
  return savedViews.find((saved) => isSameViewConfig(saved, view))?.id || null;
}

/**
 * The saved view a tab bar shows as selected. `pickedViewId` is undefined before a pick, null for
 * the table's own tab. A pick wins, since two views can hold the same config; before one, the
 * config decides
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

export function moveInOrder<T>(order: T[], from: number, to: number): T[] {
  const next = [...order];

  if (from < 0 || to < 0 || from >= next.length || from === to) {
    return next;
  }

  next.splice(to, 0, ...next.splice(from, 1));

  return next;
}
