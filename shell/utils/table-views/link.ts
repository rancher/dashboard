/**
 * What the tables on a page show, carried in its URL so it can be bookmarked or sent to someone. One
 * parameter holds every table's, encoded; the user it was showing for sits beside it in the clear,
 * so a link of one's own is told apart without decoding anything
 */
import { TABLE_VIEWS_QUERY, TABLE_VIEWS_USER_QUERY } from '@shell/config/query-params';
import type { TableViewState } from '@shell/types/table-views';

/** One table's view as a link carries it: the name of its tab, and what it shows */
export interface LinkedTableView extends TableViewState {
  name: string;
}

export interface LinkedTableViews {
  user: string;
  /** By table - see linkedTableKey */
  tables: Record<string, LinkedTableView>;
}

/** Short keys, as every character lands in the URL */
const SHORT_KEYS: Record<keyof LinkedTableView, string> = {
  name:           'n',
  query:          'q',
  columns:        'c',
  columnOrder:    'o',
  labelColumns:   'l',
  groupBy:        'g',
  sort:           's',
  sortDescending: 'd',
};

/** A table's key in the link: its resource type, and the page keeping views of its own, if any */
export function linkedTableKey(resourceType: string, page?: string | null): string {
  return page ? `${ resourceType }@${ page }` : resourceType;
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
function shorten(view: LinkedTableView): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  (Object.keys(SHORT_KEYS) as (keyof LinkedTableView)[]).forEach((key) => {
    const value = view[key];

    if (value !== null && value !== undefined && value !== '' && value !== false && !(Array.isArray(value) && !value.length)) {
      out[SHORT_KEYS[key]] = value;
    }
  });

  return out;
}

/** Anything of the wrong type is dropped, as a link can be edited by hand */
function lengthen(short: unknown): LinkedTableView | null {
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

export function encodeLinkedViews(linked: LinkedTableViews): string {
  const tables: Record<string, unknown> = {};

  Object.entries(linked.tables).forEach(([key, view]) => {
    tables[key] = shorten(view);
  });

  return toBase64Url(JSON.stringify({ u: linked.user, t: tables }));
}

/** Null for anything that doesn't decode to views */
export function decodeLinkedViews(encoded: string): LinkedTableViews | null {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded));

    if (!parsed || typeof parsed.u !== 'string' || !parsed.t || typeof parsed.t !== 'object') {
      return null;
    }

    const tables: Record<string, LinkedTableView> = {};

    Object.entries(parsed.t as Record<string, unknown>).forEach(([key, short]) => {
      const view = lengthen(short);

      if (view) {
        tables[key] = view;
      }
    });

    return { user: parsed.u, tables };
  } catch {
    return null;
  }
}

/**
 * The views a link was sent with, by table. Null for a link of one's own - which is just the page as
 * it was left, and needs nothing decoded - and for one whose views don't say they are the sender's
 */
export function sharedViewsIn(query: Record<string, unknown>, me: string | null | undefined): Record<string, LinkedTableView> | null {
  const sender = query[TABLE_VIEWS_USER_QUERY];
  const encoded = query[TABLE_VIEWS_QUERY];

  if (!me || typeof sender !== 'string' || !sender || sender === me || typeof encoded !== 'string') {
    return null;
  }

  const linked = decodeLinkedViews(encoded);

  return linked && linked.user === sender ? linked.tables : null;
}
