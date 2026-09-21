import jsyaml from 'js-yaml';
import { get } from '@shell/utils/object';
import {
  PaginationParamFilter,
  PaginationFilterField,
  PaginationFilterEquality,
} from '@shell/types/store/pagination.types';

/**
 * Table Views - the query/column/group/export engine behind the GitHub Projects style
 * toolbar shown above resource tables (see @shell/components/TableViews/TableViewsBar).
 *
 * A "view" is a saved combination of a filter query, the visible columns and a group by
 * field. Everything here is pure so it can be unit tested and reused by the toolbar,
 * the export menu and the share-by-url handling.
 */

export const LABEL_FIELD_PREFIX = 'label:';

/**
 * Fields the table itself depends on, so the user is not allowed to hide them.
 *
 * A row has to say what it is and how it is doing: without the name there is nothing to identify
 * or sort it by, and without the state there is no way to see that anything is wrong. Everything
 * else, age included, is the user's to turn off.
 */
export const CORE_FIELD_IDS = ['state', 'name'];

/**
 * Is this a column the user must not be able to remove?
 */
export function isCoreField(fieldId?: string): boolean {
  return !!fieldId && CORE_FIELD_IDS.includes(fieldId);
}

/**
 * The columns a table will not let go of, given the ones it shows by default.
 *
 * Whatever a row is identified by leads the table, so that is what cannot be hidden: state and
 * name where they lead, and otherwise simply the first column. An events list leads with its
 * state and carries a name further along, and the events on a detail page lead with when they
 * were last seen - neither has an identity column in the place the rest of the product puts it,
 * and both would be left showing nothing to recognise a row by.
 */
export function coreFieldIdsFor(defaultColumnIds?: string[]): string[] {
  const defaults = defaultColumnIds || [];
  const leading: string[] = [];

  for (const id of defaults) {
    if (!CORE_FIELD_IDS.includes(id)) {
      break;
    }

    leading.push(id);
  }

  if (leading.length) {
    return leading;
  }

  return defaults.length ? [defaults[0]] : [];
}

/**
 * A thing the user can filter on, group by, or show as a column
 */
export interface ViewField {
  /** Token used in the query string, eg `namespace` or `label:app` */
  id: string;
  /** Human readable name shown in the autocomplete/menus */
  label: string;
  isLabel: boolean;
  /** For label fields, the raw label key (may contain dots and slashes) */
  labelKey?: string;
  /** The table header this field came from, if any */
  header?: any;
}

export interface ViewTerm {
  /** Field id, or null for free text that searches every field */
  field: string | null;
  value: string;
  negated: boolean;
}

/**
 * Terms written next to each other with no joining word between them.
 *
 * These keep the rule the box has always used - repeated terms for one field mean either, terms
 * for different fields mean both - so a view saved before `and` and `or` meant anything still
 * filters exactly as it did.
 */
export type ViewGroup = ViewTerm[];

/** Groups joined by `and`: every one of them has to match */
export interface ViewClause {
  groups: ViewGroup[];
}

/**
 * A whole query: clauses joined by `or`, so a row is kept when any one of them matches.
 *
 * `and` binds tighter than `or`, the way it does everywhere else, so `a or b and c` reads as
 * `a or (b and c)`.
 */
export interface ViewQuery {
  clauses: ViewClause[];
}

export interface SavedView {
  id: string;
  name: string;
  query: string;
  /** Column names to show. null means "whatever the table shows by default" */
  columns: string[] | null;
  /** Column names in the order they are shown. null means the table's own order */
  columnOrder?: string[] | null;
  /** Label keys shown as extra columns */
  labelColumns: string[];
  /** Field id to group by, or null */
  groupBy: string | null;
  /** Column name the table is sorted by. null means the table's own default */
  sort?: string | null;
  /** Which way that sort runs */
  sortDescending?: boolean;
}

/** Columns that are structural rather than data, so never offered as fields */
const IGNORED_COLUMNS = ['check', 'actions', 'spacer'];

/** Only scan this many rows when working out which labels/values are in use */
const SCAN_LIMIT = 1000;

/**
 * Read a value off a resource without throwing on odd paths (label keys contain dots)
 */
function safeGet(row: any, path: string): any {
  if (!row || !path) {
    return undefined;
  }

  try {
    return get(row, path);
  } catch (e) {
    return undefined;
  }
}

/**
 * The value of a field for a given row, as shown in the table
 */
export function fieldValue(row: any, field: ViewField): any {
  if (!row || !field) {
    return '';
  }

  if (field.isLabel) {
    return row.metadata?.labels?.[field.labelKey as string] ?? '';
  }

  const header = field.header;

  if (!header) {
    return safeGet(row, field.id) ?? '';
  }

  if (typeof header.value === 'function') {
    try {
      return header.value(row) ?? '';
    } catch (e) {
      return '';
    }
  }

  // Only the first path is used. `sort` is often an array whose later entries are tie
  // breakers (commonly metadata.name), which would give the column a nonsense value
  let path = null;

  if (typeof header.value === 'string') {
    path = header.value;
  } else if (typeof header.sort === 'string') {
    path = header.sort.split(':')[0];
  } else if (Array.isArray(header.sort) && typeof header.sort[0] === 'string') {
    path = header.sort[0].split(':')[0];
  } else if (typeof header.search === 'string') {
    path = header.search;
  } else if (header.name) {
    path = header.name;
  }

  const out = path ? safeGet(row, path) : undefined;

  if (out !== undefined && out !== null && out !== '') {
    return out;
  }

  // Some columns compute their value rather than reading a path
  if (typeof header.getValue === 'function') {
    try {
      return header.getValue(row) ?? '';
    } catch (e) {
      return '';
    }
  }

  return '';
}

/**
 * The value a query actually filters on, which is not always the value the column shows.
 *
 * `state` is the one that bites: the column renders `stateDisplay` ("Active"), while the server
 * filters `metadata.state.name` ("active"). Suggesting the display value handed the user a term
 * the pagination API could never match, so anything offered as a value - and the values we count
 * - comes from the filterable path whenever the field has one.
 */
export function rawFieldValue(row: any, field: ViewField): any {
  if (!row || !field || field.isLabel) {
    return fieldValue(row, field);
  }

  const path = serverPathFor(field);
  // `search` can list several paths; the first is the column's own value, the rest are extras
  const first = Array.isArray(path) ? path[0] : path;

  if (typeof first === 'string') {
    const out = safeGet(row, first);

    if (out !== undefined && out !== null && out !== '') {
      return out;
    }
  }

  return fieldValue(row, field);
}

/**
 * Flatten a field value down to something we can compare/display
 */
export function stringifyValue(value: any): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map((v) => stringifyValue(v)).filter((v) => !!v).join(', ');
  }

  if (typeof value === 'object') {
    // Some columns hand back render objects, eg `{ label, color }`
    if (typeof value.label === 'string') {
      return value.label;
    }

    return '';
  }

  return `${ value }`;
}

/**
 * Turn a header name into something usable as a query token
 */
export function headerFieldId(header: any): string {
  const name = header.name || header.label || '';

  return `${ name }`.replace(/\s+/g, '-').toLowerCase();
}

/**
 * True for the structural columns that aren't worth filtering or exporting
 */
export function isIgnoredColumn(header: any): boolean {
  return IGNORED_COLUMNS.includes(headerFieldId(header));
}

/**
 * Work out everything the user can filter/group/column by for this table.
 *
 * Columns come from the table headers, plus one synthetic field per label key found on
 * the rows - which is what lets someone add a column for their own custom label.
 */
export function fieldsFor(headers: any[], rows: any[], t?: (key: string) => string): ViewField[] {
  const out: ViewField[] = [];
  const seen: Record<string, boolean> = {};

  (headers || []).forEach((header) => {
    const id = headerFieldId(header);

    if (!id || IGNORED_COLUMNS.includes(id) || seen[id]) {
      return;
    }

    let label = header.label;

    if (!label && header.labelKey && t) {
      label = t(header.labelKey);
    }

    if (!label || !`${ label }`.trim()) {
      return;
    }

    seen[id] = true;
    out.push({
      id, label, isLabel: false, header
    });
  });

  const labelKeys: Record<string, boolean> = {};
  const scan = (rows || []).slice(0, SCAN_LIMIT);

  scan.forEach((row) => {
    const labels = row?.metadata?.labels;

    if (labels) {
      Object.keys(labels).forEach((key) => {
        labelKeys[key] = true;
      });
    }
  });

  Object.keys(labelKeys).sort().forEach((key) => {
    out.push({
      id:       `${ LABEL_FIELD_PREFIX }${ key }`,
      label:    key,
      isLabel:  true,
      labelKey: key,
    });
  });

  return out;
}

export function findField(fields: ViewField[], id: string): ViewField | undefined {
  if (!id) {
    return undefined;
  }

  const lower = id.toLowerCase();

  return fields.find((f) => f.id.toLowerCase() === lower);
}

export interface QueryToken {
  start: number;
  end: number;
  text: string;
}

/**
 * The words that spell out how two terms combine.
 *
 * Accepted so that a query reads the way someone would write it - `state:active or state:error`
 * parses the same as `state:active state:error`. They carry no meaning of their own: what a
 * query does is decided by its fields (same field OR'd, different fields AND'd, see
 * {@link applyQuery}), and parsing skips the words, so a hand typed `and` between two terms of
 * the same field does not narrow it. Nothing writes them for the user.
 */
export const CONNECTIVES = ['and', 'or'];

/** Spelled out negation, the word form of the `-` and `!` prefixes */
export const NEGATORS = ['not'];

export function isConnective(text: string): boolean {
  return CONNECTIVES.includes((text || '').toLowerCase());
}

export function isNegator(text: string): boolean {
  return NEGATORS.includes((text || '').toLowerCase());
}

function isOr(text: string): boolean {
  return (text || '').toLowerCase() === 'or';
}

/**
 * One term of a query, resolved against the table's fields and located in the text.
 *
 * `state: active` is a single term written as two whitespace separated chunks, which is why
 * this exists rather than the raw {@link tokenize} output - the autocomplete has to replace the
 * whole of it, and the highlighter has to colour each part of it.
 */
export interface QueryTerm extends QueryToken {
  kind: 'term' | 'connective';
  /** The `-` or `!` written at the front of this token, if any. Empty for a spelled out `not`,
   * which is a token of its own - so this stays the count of characters to skip, and `negated`
   * is what says whether the term is negated at all */
  negate: string;
  /** Is this term negated, by either form? */
  negated: boolean;
  /** The field the term resolved to, or null for free text */
  field: ViewField | null;
  /** The field as typed, without the colon */
  fieldText: string;
  /** The value as typed, unquoted */
  value: string;
  /** Offset of the value in the query, so the highlighter can reproduce the gap before it */
  valueStart: number;
}

/**
 * Split a query into tokens, keeping quoted values (`app:"my app"`) together and
 * recording where each token sits so the autocomplete can replace the one being typed.
 */
export function tokenize(query: string): QueryToken[] {
  const out: QueryToken[] = [];
  const str = query || '';
  let i = 0;

  while (i < str.length) {
    while (i < str.length && str[i] === ' ') {
      i++;
    }

    if (i >= str.length) {
      break;
    }

    const start = i;
    let quote: string | null = null;

    while (i < str.length) {
      const char = str[i];

      if (quote) {
        if (char === quote) {
          quote = null;
        }
      } else if (char === '"' || char === `'`) {
        quote = char;
      } else if (char === ' ') {
        break;
      }

      i++;
    }

    out.push({
      start,
      end:  i,
      text: str.substring(start, i)
    });
  }

  return out;
}

function unquote(value: string): string {
  if (value.length > 1 && (value[0] === '"' || value[0] === `'`) && value[value.length - 1] === value[0]) {
    return value.substring(1, value.length - 1);
  }

  return value;
}

export function quoteIfNeeded(value: string): string {
  return /[\s:]/.test(value) ? `"${ value }"` : value;
}

/**
 * Resolve the field named at the start of `text`, if any.
 *
 * A label field's own id contains a colon (`label:app`), so where an ordinary field ends at the
 * first colon a label one ends at the last.
 */
function fieldAt(text: string, fields: ViewField[]): ViewField | null {
  const idx = text.indexOf(':');

  if (idx <= 0) {
    return null;
  }

  const field = findField(fields, text.substring(0, idx));

  if (field) {
    return field;
  }

  if (text.toLowerCase().startsWith(LABEL_FIELD_PREFIX)) {
    return findField(fields, text.substring(0, text.lastIndexOf(':'))) || null;
  }

  return null;
}

/**
 * Read a query as a list of terms and connectives, resolved against this table's fields.
 *
 * A term is a single run of non-space characters, `state:active`. What separates the field from
 * its value on screen is the badge drawn around the value, not a character in the query - so a
 * space always ends the term, and `state: active` is the field with nothing in it followed by
 * the free text `active`.
 */
export function scanQuery(query: string, fields: ViewField[]): QueryTerm[] {
  const raw = tokenize(query || '');
  const out: QueryTerm[] = [];
  // Set by a `not` standing on its own, and spent on the term that follows it
  let pendingNot = false;

  for (let i = 0; i < raw.length; i++) {
    const chunk = raw[i];
    let text = chunk.text;

    if (isConnective(text)) {
      out.push({
        ...chunk, kind: 'connective', negate: '', negated: false, field: null, fieldText: '', value: text, valueStart: chunk.start
      });
      continue;
    }

    if (isNegator(text)) {
      pendingNot = true;
      out.push({
        ...chunk, kind: 'connective', negate: '', negated: false, field: null, fieldText: '', value: text, valueStart: chunk.start
      });
      continue;
    }

    let negate = '';

    if (text.startsWith('-') || text.startsWith('!')) {
      negate = text.substring(0, 1);
      text = text.substring(1);
    }

    const negated = !!negate || pendingNot;

    pendingNot = false;

    const field = fieldAt(text, fields);

    if (!field) {
      out.push({
        ...chunk, kind: 'term', negate, negated, field: null, fieldText: '', value: unquote(text), valueStart: chunk.start + negate.length
      });
      continue;
    }

    const typed = text.substring(field.id.length + 1);

    out.push({
      start:      chunk.start,
      end:        chunk.end,
      text:       chunk.text,
      kind:       'term',
      negate,
      negated,
      field,
      fieldText:  text.substring(0, field.id.length),
      value:      unquote(typed),
      valueStart: chunk.start + negate.length + field.id.length + 1,
    });
  }

  return out;
}

/**
 * `value` is a value the field actually has; `value-unknown` is one it does not - typed by hand,
 * or half typed. Only the first is worth dressing up as a badge.
 */
export type QuerySegmentKind = 'field' | 'value' | 'value-unknown' | 'connective' | 'text' | 'plain';

export interface QuerySegment {
  text: string;
  kind: QuerySegmentKind;
}

/**
 * Break a query into coloured segments for the input to draw.
 *
 * The segments put back together are the query, character for character, whitespace included.
 *
 * `isKnownValue` decides whether a term's value is one the field actually has, which is what
 * separates a `value` segment from a `value-unknown` one. Left out, every value is taken at face
 * value - callers that have no way to check are no worse off than before.
 */
export function highlightQuery(
  query: string,
  fields: ViewField[],
  isKnownValue?: (fieldId: string, value: string) => boolean
): QuerySegment[] {
  const str = query || '';
  const out: QuerySegment[] = [];
  let at = 0;

  const plain = (end: number) => {
    if (end > at) {
      out.push({ text: str.substring(at, end), kind: 'plain' });
      at = end;
    }
  };

  scanQuery(str, fields).forEach((token) => {
    plain(token.start);

    if (token.kind === 'connective') {
      out.push({ text: token.text, kind: 'connective' });
      at = token.end;

      return;
    }

    if (!token.field) {
      out.push({ text: token.text, kind: 'text' });
      at = token.end;

      return;
    }

    // `-state:` — the negation reads as part of the field
    out.push({ text: str.substring(token.start, token.start + token.negate.length + token.fieldText.length + 1), kind: 'field' });
    at = token.start + token.negate.length + token.fieldText.length + 1;

    // whatever sits between the colon and the value, normally a single space
    plain(token.valueStart);

    if (token.end > at) {
      const known = !isKnownValue || isKnownValue(token.field.id, token.value);

      out.push({ text: str.substring(at, token.end), kind: known ? 'value' : 'value-unknown' });
      at = token.end;
    }
  });

  plain(str.length);

  return out;
}


/**
 * Parse `state:error -namespace:kube-system nginx` into terms.
 *
 * `field:value` only becomes a field term when the field actually exists on this table,
 * otherwise it stays free text (so searching for an image tag still works).
 */
export function parseQuery(query: string, fields: ViewField[]): ViewTerm[] {
  return scanQuery(query, fields)
    // The connectives are there to be read; the fields are what decide how terms combine
    .filter((token) => token.kind === 'term' && !!token.value)
    .map((token) => ({
      field:   token.field ? token.field.id : null,
      value:   token.value,
      negated: token.negated,
    }));
}

/**
 * Read a query as what it actually asks for: clauses joined by `or`, each a set of groups
 * joined by `and`.
 *
 * A query with no joining words in it comes back as a single group, which is what every query
 * was treated as before - so nothing already saved changes meaning.
 */
export function parseQueryExpression(query: string, fields: ViewField[]): ViewQuery {
  const clauses: ViewClause[] = [];
  let groups: ViewGroup[] = [];
  let group: ViewGroup = [];

  const endGroup = () => {
    if (group.length) {
      groups.push(group);
      group = [];
    }
  };

  const endClause = () => {
    endGroup();

    if (groups.length) {
      clauses.push({ groups });
      groups = [];
    }
  };

  scanQuery(query || '', fields).forEach((token) => {
    if (token.kind === 'connective') {
      // `not` belongs to the term after it, which scanQuery has already marked - it joins
      // nothing, so it never divides one group from the next
      if (isNegator(token.text)) {
        return;
      }

      if (isOr(token.text)) {
        endClause();
      } else {
        endGroup();
      }

      return;
    }

    // A term still being typed has nothing to match on yet
    if (!token.value) {
      return;
    }

    group.push({
      field:   token.field ? token.field.id : null,
      value:   token.value,
      negated: token.negated,
    });
  });

  endClause();

  return { clauses };
}

/**
 * Does this field on this row contain `needle`?
 *
 * Both the shown value and the filterable one count, so the same query behaves the same way
 * client-side and server-side: `state:active` has to match the row whose column reads "Active",
 * and someone typing what they can see, `state:Act`, has to match it too.
 */
function fieldContains(row: any, field: ViewField, needle: string): boolean {
  if (stringifyValue(fieldValue(row, field)).toLowerCase().includes(needle)) {
    return true;
  }

  return stringifyValue(rawFieldValue(row, field)).toLowerCase().includes(needle);
}

function matchesTerm(row: any, term: ViewTerm, fields: ViewField[]): boolean {
  const needle = term.value.toLowerCase();

  if (term.field) {
    const field = findField(fields, term.field);

    if (!field) {
      return true;
    }

    return fieldContains(row, field, needle);
  }

  return fields.some((field) => fieldContains(row, field, needle));
}

/**
 * Does a row satisfy one group of terms?
 *
 * Terms for different fields are ANDed, repeated terms for the same field are ORed
 * (`state:error state:crash` = either), which is what GitHub does.
 */
function matchesGroup(row: any, terms: ViewGroup, fields: ViewField[]): boolean {
  const positive: Record<string, ViewTerm[]> = {};
  const negative: ViewTerm[] = [];

  terms.forEach((term) => {
    if (term.negated) {
      negative.push(term);
    } else {
      const key = term.field || '__text__';

      positive[key] = positive[key] || [];
      positive[key].push(term);
    }
  });

  for (const group of Object.values(positive)) {
    if (!group.some((term) => matchesTerm(row, term, fields))) {
      return false;
    }
  }

  for (const term of negative) {
    if (matchesTerm(row, term, fields)) {
      return false;
    }
  }

  return true;
}

/**
 * Apply a whole query: any clause matching keeps the row, and a clause matches when every one
 * of its groups does.
 */
export function applyQueryExpression(rows: any[], query: ViewQuery, fields: ViewField[]): any[] {
  const clauses = query?.clauses || [];

  if (!clauses.length) {
    return rows;
  }

  return rows.filter((row) => clauses.some((clause) => clause.groups.every((group) => matchesGroup(row, group, fields))));
}

/**
 * Apply a flat list of terms - a query with no joining words in it, which is one group.
 */
export function applyQuery(rows: any[], terms: ViewTerm[], fields: ViewField[]): any[] {
  if (!terms.length) {
    return rows;
  }

  return applyQueryExpression(rows, { clauses: [{ groups: [terms] }] }, fields);
}

/**
 * Well known field ids whose server-side path we know for certain, for columns that don't say
 * how they are searched. A column that declares its own `search` is taken at its word - see
 * serverPathFor - and this is what the rest fall back to rather than a `value` the api cannot
 * filter on (`stateDisplay` and friends).
 */
const SERVER_PATH_SAFETY_NET: Record<string, string> = {
  state:     'metadata.state.name',
  name:      'metadata.name',
  namespace: 'metadata.namespace',
  image:     'spec.containers.image',
  node:      'spec.nodeName',
};

/**
 * The steve/vai server-side path(s) to filter a field on, or null when the field has no
 * server-side representation.
 *
 * Mirrors the server-searchable rule used when building headers in ResourceTable (a column
 * is server searchable when it has a string/array `search`, or a string `value`/`sort`).
 */
export function serverPathFor(field: ViewField): string | string[] | null {
  if (!field) {
    return null;
  }

  if (field.isLabel) {
    return field.labelKey ? `metadata.labels[${ field.labelKey }]` : null;
  }

  const header = field.header;

  // An explicit `search` is the column saying what it is searched on, so it wins. The cluster
  // list is the one that matters: its name column searches `spec.displayName`, because a
  // management cluster's `metadata.name` is an id (`c-m-zv88n64p`) and never what is on screen.
  if (typeof header?.search === 'string') {
    return header.search;
  }

  if (Array.isArray(header?.search)) {
    return header.search;
  }

  // Then the handful of ids we know the canonical path for, which covers the columns that say
  // nothing about how to search them
  if (SERVER_PATH_SAFETY_NET[field.id]) {
    return SERVER_PATH_SAFETY_NET[field.id];
  }

  if (!header) {
    return null;
  }

  if (typeof header.value === 'string') {
    return header.value;
  }

  if (typeof header.sort === 'string') {
    // `sort` can carry a `:desc` style suffix, only the path is useful for filtering
    return header.sort.split(':')[0];
  }

  return null;
}

export interface ServerFilterResult {
  filters: PaginationParamFilter[];
  unsupported: ViewTerm[];
}

/** Values with these chars break the `filter=field IN (a,b)` serializer (verbatim insert) */
function breaksInSerializer(value: string): boolean {
  return /[,()"]/.test(value);
}

/**
 * Convert parsed view terms into steve/vai `filter=` params.
 *
 * - A field with a single value becomes a partial CONTAINS (`~`) match
 * - The same field with multiple values becomes an `IN (...)` match
 * - Different fields are AND'd (each wrapped in its own PaginationParamFilter)
 * - Free text tokens CONTAINS-match across every server-searchable column (OR within a
 *   token, AND across tokens)
 *
 * Terms whose field has no server-side path (or fails `opts.isAllowed`) are routed to
 * `unsupported` and are NOT applied - they are dropped server-side for v1.
 */
export function termsToServerFilters(
  terms: ViewTerm[],
  fields: ViewField[],
  opts: { isAllowed: (path: string) => boolean }
): ServerFilterResult {
  const filters: PaginationParamFilter[] = [];
  const unsupported: ViewTerm[] = [];

  if (!terms || !terms.length) {
    return { filters, unsupported };
  }

  const isAllowed = opts && typeof opts.isAllowed === 'function' ? opts.isAllowed : () => false;

  // Resolve a field id to the set of allowed server paths (or null if none are allowed)
  const allowedPathsFor = (fieldId: string): string[] | null => {
    const field = findField(fields, fieldId);

    if (!field) {
      return null;
    }

    const raw = serverPathFor(field);

    if (!raw) {
      return null;
    }

    const paths = (Array.isArray(raw) ? raw : [raw]).filter((p) => typeof p === 'string' && isAllowed(p));

    return paths.length ? paths : null;
  };

  // Every server-searchable path, for free-text tokens to OR across.
  //
  // Label columns are deliberately left out. Each `metadata.labels[key]` term costs the
  // pagination API a join, and OR'ing a handful of them together is enough to hang it - a pod
  // list carrying 14 label columns never answered at all, while the same query across the
  // ordinary columns came back in under a second. Labels stay searchable by naming one,
  // `label:app:nginx`, which is a single join.
  const freeTextPaths: string[] = [];
  const seenPath: Record<string, boolean> = {};

  fields.forEach((field) => {
    if (field.isLabel) {
      return;
    }

    const raw = serverPathFor(field);

    if (!raw) {
      return;
    }

    (Array.isArray(raw) ? raw : [raw]).forEach((p) => {
      if (typeof p === 'string' && isAllowed(p) && !seenPath[p]) {
        seenPath[p] = true;
        freeTextPaths.push(p);
      }
    });
  });

  // Group by field id + negation (like applyQuery, but positive/negative kept per field)
  const groups: Record<string, ViewTerm[]> = {};
  const order: string[] = [];
  const freeText: ViewTerm[] = [];

  terms.forEach((term) => {
    if (term.field === null || term.field === undefined) {
      freeText.push(term);

      return;
    }

    const key = `${ term.negated ? '!' : '' }${ term.field }`;

    if (!groups[key]) {
      groups[key] = [];
      order.push(key);
    }

    groups[key].push(term);
  });

  order.forEach((key) => {
    const group = groups[key];
    const { negated } = group[0];
    const fieldId = group[0].field as string;
    const paths = allowedPathsFor(fieldId);

    if (!paths) {
      unsupported.push(...group);

      return;
    }

    const values = group.map((t) => t.value);

    if (paths.length === 1) {
      const path = paths[0];

      if (values.length > 1) {
        if (values.some(breaksInSerializer)) {
          // IN serializer inserts values verbatim, so fall back to CONTAINS
          if (negated) {
            // NOT: row must satisfy all of them -> AND (one param each)
            values.forEach((value) => {
              filters.push(new PaginationParamFilter({
                fields: [new PaginationFilterField({
                  field: path, value, equality: PaginationFilterEquality.NOT_CONTAINS
                })]
              }));
            });
          } else {
            // OR within one param
            filters.push(new PaginationParamFilter({
              fields: values.map((value) => new PaginationFilterField({
                field: path, value, equality: PaginationFilterEquality.CONTAINS
              }))
            }));
          }
        } else {
          filters.push(new PaginationParamFilter({
            fields: [new PaginationFilterField({
              field: path, value: values.join(','), equality: negated ? PaginationFilterEquality.NOT_IN : PaginationFilterEquality.IN
            })]
          }));
        }
      } else {
        filters.push(new PaginationParamFilter({
          fields: [new PaginationFilterField({
            field: path, value: values[0], equality: negated ? PaginationFilterEquality.NOT_CONTAINS : PaginationFilterEquality.CONTAINS
          })]
        }));
      }
    } else if (negated) {
      // Multiple columns, negated: row must not match in ANY column -> AND (one param each)
      values.forEach((value) => {
        paths.forEach((path) => {
          filters.push(new PaginationParamFilter({
            fields: [new PaginationFilterField({
              field: path, value, equality: PaginationFilterEquality.NOT_CONTAINS
            })]
          }));
        });
      });
    } else {
      // Multiple columns, positive: OR every (value x column) within one param
      const oredFields: PaginationFilterField[] = [];

      values.forEach((value) => {
        paths.forEach((path) => {
          oredFields.push(new PaginationFilterField({
            field: path, value, equality: PaginationFilterEquality.CONTAINS
          }));
        });
      });

      filters.push(new PaginationParamFilter({ fields: oredFields }));
    }
  });

  // Free text: one param per token, CONTAINS across every searchable column (OR)
  freeText.forEach((term) => {
    if (!freeTextPaths.length) {
      unsupported.push(term);

      return;
    }

    // Negated free text means the word appears in no column at all. `not (a or b)` is
    // `(not a) and (not b)`, and separate params are AND'd - so it is one NOT_CONTAINS per
    // column rather than something the api can't express.
    if (term.negated) {
      freeTextPaths.forEach((path) => {
        filters.push(new PaginationParamFilter({
          fields: [new PaginationFilterField({
            field: path, value: term.value, equality: PaginationFilterEquality.NOT_CONTAINS
          })]
        }));
      });

      return;
    }

    filters.push(new PaginationParamFilter({
      fields: freeTextPaths.map((path) => new PaginationFilterField({
        field: path, value: term.value, equality: PaginationFilterEquality.CONTAINS
      }))
    }));
  });

  return { filters, unsupported };
}

/**
 * How many filter params an `or` is allowed to expand into.
 *
 * The api AND's separate params and OR's the fields inside one, so an `or` between two sides
 * that each carry several conditions has to be turned inside out - and that multiplies. A query
 * elaborate enough to go past this is reported rather than sent as something enormous.
 */
const MAX_OR_FILTERS = 16;

/** Every term in a query, whichever clause or group it sits in */
function allTerms(query: ViewQuery): ViewTerm[] {
  return (query?.clauses || []).reduce((acc: ViewTerm[], clause) => acc.concat(...clause.groups), []);
}

/**
 * Convert a whole query into steve/vai `filter=` params.
 *
 * The api gives us exactly one shape: separate params are AND'd, and the fields within a param
 * are OR'd. `and` is therefore free - it is just more params - while `or` has to be turned
 * inside out, `(a and b) or c` becoming `(a or c) and (b or c)`.
 *
 * Where that cannot be done - a side of an `or` that the api cannot constrain at all, or an
 * expansion too large to be worth sending - nothing is filtered and every term is reported as
 * unsupported, so the toolbar says the query did not run rather than the table narrowing by
 * half of it.
 */
export function queryToServerFilters(
  query: ViewQuery,
  fields: ViewField[],
  opts: { isAllowed: (path: string) => boolean }
): ServerFilterResult {
  const clauses = query?.clauses || [];

  if (!clauses.length) {
    return { filters: [], unsupported: [] };
  }

  const unsupported: ViewTerm[] = [];
  // `and` between groups is just another param, so a clause is the concatenation of its groups
  const perClause = clauses.map((clause) => {
    const filters: PaginationParamFilter[] = [];

    clause.groups.forEach((group) => {
      const result = termsToServerFilters(group, fields, opts);

      filters.push(...result.filters);
      unsupported.push(...result.unsupported);
    });

    return filters;
  });

  if (perClause.length === 1) {
    return { filters: perClause[0], unsupported };
  }

  // A side of an `or` that constrains nothing leaves the whole query constraining nothing -
  // narrowing by the other side alone would hide the rows this one was asking for
  if (perClause.some((filters) => !filters.length)) {
    return { filters: [], unsupported: allTerms(query) };
  }

  if (perClause.reduce((acc, filters) => acc * filters.length, 1) > MAX_OR_FILTERS) {
    return { filters: [], unsupported: allTerms(query) };
  }

  // One param for each way of taking one param from every clause, holding all their fields OR'd
  let combinations: PaginationFilterField[][] = [[]];

  perClause.forEach((filters) => {
    const next: PaginationFilterField[][] = [];

    combinations.forEach((sofar) => {
      filters.forEach((filter) => next.push(sofar.concat(filter.fields || [])));
    });

    combinations = next;
  });

  return { filters: combinations.map((f) => new PaginationParamFilter({ fields: f })), unsupported };
}

export interface ValueSuggestion {
  value: string;
  count: number;
}

/**
 * The values currently in use for a field, most common first.
 *
 * This is what powers the GitHub style "start typing a field and see the values that
 * exist in the data" autocomplete.
 */
/**
 * Turn a steve `summary=<field>&summaryonly` response into value suggestions.
 *
 * The summary counts every row the type has, not just the page in front of us, so the values it
 * gives back are the real set in use. Most used first, so the suggestions are worth reading.
 */
export function summaryToValues(response: any, max = 50): ValueSuggestion[] {
  const counts = response?.summary?.[0]?.counts || {};

  return Object.keys(counts)
    .map((value) => ({ value, count: counts[value]?.total ?? 0 }))
    .filter((entry) => !!entry.value)
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, max);
}

export function valuesInUse(rows: any[], field: ViewField, max = 25): ValueSuggestion[] {
  const counts: Record<string, number> = {};

  (rows || []).slice(0, SCAN_LIMIT).forEach((row) => {
    // The filterable value, not the rendered one - see rawFieldValue
    const raw = rawFieldValue(row, field);
    const values = Array.isArray(raw) ? raw : [raw];

    values.forEach((entry) => {
      const value = stringifyValue(entry).trim();

      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });
  });

  return Object.entries(counts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, max);
}

/**
 * Replace the token the caret is sitting in with `replacement`
 */
export function replaceToken(query: string, token: QueryToken | null, replacement: string, caret?: number): string {
  if (token) {
    return `${ query.substring(0, token.start) }${ replacement }${ query.substring(token.end) }`;
  }

  // Nothing under the caret means it is sitting in the space between two terms, and what is
  // picked belongs there - not at the end of a query the user may be standing in the middle of.
  if (typeof caret === 'number') {
    const at = Math.max(0, Math.min(caret, query.length));
    const before = query.substring(0, at);
    const prefix = !before || before.endsWith(' ') ? before : `${ before } `;

    return `${ prefix }${ replacement }${ query.substring(at) }`;
  }

  const prefix = query && !query.endsWith(' ') ? `${ query } ` : query || '';

  return `${ prefix }${ replacement }`;
}

/**
 * The term the caret is sitting in, so the autocomplete can replace the whole of it.
 *
 * Without `fields` this falls back to raw chunks, which is enough for callers that only need to
 * know where a word starts and ends.
 */
export function tokenAt(query: string, caret: number, fields?: ViewField[]): QueryToken | null {
  const tokens = fields ? scanQuery(query, fields).filter((token) => token.kind === 'term') : tokenize(query);

  return tokens.find((token) => caret >= token.start && caret <= token.end) || null;
}

function csvCell(value: string): string {
  if (/["\n,]/.test(value)) {
    return `"${ value.replace(/"/g, '""') }"`;
  }

  return value;
}

export interface ExportColumn {
  label: string;
  field: ViewField;
}

/**
 * The columns an export writes, worked out from a table's headers.
 *
 * Shared so that the two ways of exporting agree: the toolbar writes the view's columns, and a
 * selection exported from a resource's own actions writes that resource's columns. Both come
 * through here, so neither can quietly grow a column set of its own.
 */
export function exportColumnsFor(headers: any[], t: (key: string) => string): ExportColumn[] {
  return (headers || [])
    .filter((header) => !isIgnoredColumn(header) && (header.label || header.labelKey))
    .map((header) => {
      const label = header.label || t(header.labelKey);

      return {
        label,
        field: {
          id: headerFieldId(header), label, isLabel: false, header
        }
      };
    });
}

export function rowsToCsv(rows: any[], columns: ExportColumn[]): string {
  const lines = [columns.map((c) => csvCell(c.label)).join(',')];

  rows.forEach((row) => {
    lines.push(columns.map((c) => csvCell(stringifyValue(fieldValue(row, c.field)))).join(','));
  });

  return lines.join('\n');
}

/**
 * The rows as plain records, one per row, keyed by the column headings on screen. What every
 * export format is built from.
 */
function rowsToRecords(rows: any[], columns: ExportColumn[]): Record<string, string>[] {
  return rows.map((row) => columns.reduce((acc: Record<string, string>, c) => {
    acc[c.label] = stringifyValue(fieldValue(row, c.field));

    return acc;
  }, {}));
}

export function rowsToYaml(rows: any[], columns: ExportColumn[]): string {
  return jsyaml.dump(rowsToRecords(rows, columns));
}

export function rowsToJson(rows: any[], columns: ExportColumn[]): string {
  return JSON.stringify(rowsToRecords(rows, columns), null, 2);
}

/**
 * Encode a view so it can be dropped in a url and shared with someone else
 */
export function encodeView(view: Partial<SavedView>): string {
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

export function decodeView(encoded: string): Partial<SavedView> | null {
  if (!encoded) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeURIComponent(window.atob(encoded)));

    return {
      name:         payload.n || '',
      query:        payload.q || '',
      columns:      payload.c || null,
      columnOrder:  payload.o || null,
      labelColumns: payload.l || [],
      groupBy:      payload.g || null,
    };
  } catch (e) {
    return null;
  }
}
