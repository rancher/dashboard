/**
 * A table's view as Share View hands it out and Import View takes it in: its tab's name and what it
 * shows, encoded so it can be copied and pasted whole. A string can hold more than one table, keyed by
 * type and page, so one holding several still imports the one it is asked for
 */
import type { TableViewState } from '@shell/types/table-views';

/** One table's view as a shared string carries it: the name of its tab, and what it shows */
export interface SharedTableView extends TableViewState {
  name: string;
}

export interface SharedTableViews {
  /** The persistence id of the user who shared it, if they had one. Kept, not checked */
  key: string;
  /** By table - see sharedTableKey */
  tables: Record<string, SharedTableView>;
}

/** Short keys, to keep the string short */
const SHORT_KEYS: Record<keyof SharedTableView, string> = {
  name:           'n',
  query:          'q',
  columns:        'c',
  columnOrder:    'o',
  labelColumns:   'l',
  groupBy:        'g',
  sort:           's',
  sortDescending: 'd',
};

/** A table's key in a shared string: its resource type, and the page keeping views of its own, if any */
export function sharedTableKey(resourceType: string, page?: string | null): string {
  return page ? `${ resourceType }@${ page }` : resourceType;
}

/** The resource type a table's key is for */
export function sharedTableType(tableKey: string): string {
  return tableKey.split('@')[0];
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';

  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));

  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

const isStringList = (value: unknown): value is string[] => Array.isArray(value) && value.every((v) => typeof v === 'string');

const stringOrNull = (value: unknown): string | null => (typeof value === 'string' && value ? value : null);

/** Empty values are left out */
function shorten(view: SharedTableView): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  (Object.keys(SHORT_KEYS) as (keyof SharedTableView)[]).forEach((key) => {
    const value = view[key];

    if (value !== null && value !== undefined && value !== '' && value !== false && !(Array.isArray(value) && !value.length)) {
      out[SHORT_KEYS[key]] = value;
    }
  });

  return out;
}

/** Anything of the wrong type is dropped, as a string can be edited by hand */
function lengthen(short: unknown): SharedTableView | null {
  if (!short || typeof short !== 'object') {
    return null;
  }

  const s = short as Record<string, unknown>;
  const name = stringOrNull(s[SHORT_KEYS.name]);

  if (!name) {
    return null;
  }

  return {
    name,
    query:          stringOrNull(s[SHORT_KEYS.query]) || '',
    columns:        isStringList(s[SHORT_KEYS.columns]) ? s[SHORT_KEYS.columns] as string[] : null,
    columnOrder:    isStringList(s[SHORT_KEYS.columnOrder]) ? s[SHORT_KEYS.columnOrder] as string[] : null,
    labelColumns:   isStringList(s[SHORT_KEYS.labelColumns]) ? s[SHORT_KEYS.labelColumns] as string[] : [],
    groupBy:        stringOrNull(s[SHORT_KEYS.groupBy]),
    sort:           stringOrNull(s[SHORT_KEYS.sort]),
    sortDescending: s[SHORT_KEYS.sortDescending] === true,
  };
}

export function encodeSharedViews(shared: SharedTableViews): string {
  const tables: Record<string, unknown> = {};

  Object.entries(shared.tables).forEach(([key, view]) => {
    tables[key] = shorten(view);
  });

  return toBase64Url(JSON.stringify({ k: shared.key, t: tables }));
}

/** Null for anything that doesn't decode to views */
export function decodeSharedViews(encoded: string): SharedTableViews | null {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded.trim()));

    if (!parsed || !parsed.t || typeof parsed.t !== 'object') {
      return null;
    }

    const tables: Record<string, SharedTableView> = {};

    Object.entries(parsed.t as Record<string, unknown>).forEach(([key, short]) => {
      const view = lengthen(short);

      if (view) {
        tables[key] = view;
      }
    });

    return Object.keys(tables).length ? { key: typeof parsed.k === 'string' ? parsed.k : '', tables } : null;
  } catch {
    return null;
  }
}

/** What Share View hands out for one table */
export function shareTableView(tableKey: string, view: SharedTableView, persistenceId?: string | null): string {
  return encodeSharedViews({ key: persistenceId || '', tables: { [tableKey]: view } });
}

export type ImportedTableView =
  { view: SharedTableView } |
  { problem: 'invalid' } |
  /** Shared from another table: the one it is for */
  { problem: 'otherTable', tableKey: string };

/** What Import View makes of a pasted string, for the table it was opened on */
export function importTableView(text: string, tableKey: string): ImportedTableView {
  const shared = text.trim() ? decodeSharedViews(text) : null;

  if (!shared) {
    return { problem: 'invalid' };
  }

  const view = shared.tables[tableKey];

  return view ? { view } : { problem: 'otherTable', tableKey: Object.keys(shared.tables)[0] };
}
