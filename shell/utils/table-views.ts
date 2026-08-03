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

export interface SavedView {
  id: string;
  name: string;
  query: string;
  /** Column names to show. null means "whatever the table shows by default" */
  columns: string[] | null;
  /** Label keys shown as extra columns */
  labelColumns: string[];
  /** Field id to group by, or null */
  groupBy: string | null;
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
 * Parse `state:error -namespace:kube-system nginx` into terms.
 *
 * `field:value` only becomes a field term when the field actually exists on this table,
 * otherwise it stays free text (so searching for an image tag still works).
 */
export function parseQuery(query: string, fields: ViewField[]): ViewTerm[] {
  return tokenize(query).map((token) => {
    let text = token.text;
    let negated = false;

    if (text.startsWith('-') || text.startsWith('!')) {
      negated = true;
      text = text.substring(1);
    }

    const idx = text.indexOf(':');

    if (idx > 0) {
      let field = findField(fields, text.substring(0, idx));

      if (!field && text.toLowerCase().startsWith(LABEL_FIELD_PREFIX)) {
        // A label field id is itself `label:<key>`, so the value starts after the last colon
        field = findField(fields, text.substring(0, text.lastIndexOf(':')));
      }

      if (field) {
        return {
          field: field.id, value: unquote(text.substring(field.id.length + 1)), negated
        };
      }
    }

    return {
      field: null, value: unquote(text), negated
    };
  }).filter((term) => !!term.value);
}

function matchesTerm(row: any, term: ViewTerm, fields: ViewField[]): boolean {
  const needle = term.value.toLowerCase();

  if (term.field) {
    const field = findField(fields, term.field);

    if (!field) {
      return true;
    }

    return stringifyValue(fieldValue(row, field)).toLowerCase().includes(needle);
  }

  return fields.some((field) => stringifyValue(fieldValue(row, field)).toLowerCase().includes(needle));
}

/**
 * Apply the parsed query. Terms for different fields are ANDed, repeated terms for the
 * same field are ORed (`state:error state:crash` = either), which is what GitHub does.
 */
export function applyQuery(rows: any[], terms: ViewTerm[], fields: ViewField[]): any[] {
  if (!terms.length) {
    return rows;
  }

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

  const groups = Object.values(positive);

  return rows.filter((row) => {
    for (const group of groups) {
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
  });
}

/**
 * Well known field ids whose server-side path we know for certain, regardless of how the
 * table header happens to be configured. Overlaid on top of the header-derived path so a
 * mis-configured header can't send us to a path the vai cache can't filter on.
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

  // Safety net wins for the handful of ids we know the canonical path for
  if (SERVER_PATH_SAFETY_NET[field.id]) {
    return SERVER_PATH_SAFETY_NET[field.id];
  }

  const header = field.header;

  if (!header) {
    return null;
  }

  if (typeof header.search === 'string') {
    return header.search;
  }

  if (Array.isArray(header.search)) {
    return header.search;
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

  // Every server-searchable path, for free-text tokens to OR across
  const freeTextPaths: string[] = [];
  const seenPath: Record<string, boolean> = {};

  fields.forEach((field) => {
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
              filters.push(new PaginationParamFilter({ fields: [new PaginationFilterField({ field: path, value, equality: PaginationFilterEquality.NOT_CONTAINS })] }));
            });
          } else {
            // OR within one param
            filters.push(new PaginationParamFilter({ fields: values.map((value) => new PaginationFilterField({ field: path, value, equality: PaginationFilterEquality.CONTAINS })) }));
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
          filters.push(new PaginationParamFilter({ fields: [new PaginationFilterField({ field: path, value, equality: PaginationFilterEquality.NOT_CONTAINS })] }));
        });
      });
    } else {
      // Multiple columns, positive: OR every (value x column) within one param
      const oredFields: PaginationFilterField[] = [];

      values.forEach((value) => {
        paths.forEach((path) => {
          oredFields.push(new PaginationFilterField({ field: path, value, equality: PaginationFilterEquality.CONTAINS }));
        });
      });

      filters.push(new PaginationParamFilter({ fields: oredFields }));
    }
  });

  // Free text: one param per token, CONTAINS across every searchable column (OR)
  freeText.forEach((term) => {
    // Negated free text (OR of NOT across columns) can't be expressed server-side, drop it
    if (term.negated || !freeTextPaths.length) {
      unsupported.push(term);

      return;
    }

    filters.push(new PaginationParamFilter({ fields: freeTextPaths.map((path) => new PaginationFilterField({ field: path, value: term.value, equality: PaginationFilterEquality.CONTAINS })) }));
  });

  return { filters, unsupported };
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
export function valuesInUse(rows: any[], field: ViewField, max = 25): ValueSuggestion[] {
  const counts: Record<string, number> = {};

  (rows || []).slice(0, SCAN_LIMIT).forEach((row) => {
    const raw = fieldValue(row, field);
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
export function replaceToken(query: string, token: QueryToken | null, replacement: string): string {
  if (!token) {
    const prefix = query && !query.endsWith(' ') ? `${ query } ` : query || '';

    return `${ prefix }${ replacement }`;
  }

  return `${ query.substring(0, token.start) }${ replacement }${ query.substring(token.end) }`;
}

export function tokenAt(query: string, caret: number): QueryToken | null {
  return tokenize(query).find((token) => caret >= token.start && caret <= token.end) || null;
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

export function rowsToCsv(rows: any[], columns: ExportColumn[]): string {
  const lines = [columns.map((c) => csvCell(c.label)).join(',')];

  rows.forEach((row) => {
    lines.push(columns.map((c) => csvCell(stringifyValue(fieldValue(row, c.field)))).join(','));
  });

  return lines.join('\n');
}

export function rowsToJson(rows: any[], columns: ExportColumn[]): string {
  const out = rows.map((row) => {
    return columns.reduce((acc: Record<string, string>, c) => {
      acc[c.label] = stringifyValue(fieldValue(row, c.field));

      return acc;
    }, {});
  });

  return JSON.stringify(out, null, 2);
}

/**
 * Encode a view so it can be dropped in a url and shared with someone else
 */
export function encodeView(view: Partial<SavedView>): string {
  const payload = JSON.stringify({
    n: view.name || '',
    q: view.query || '',
    c: view.columns || null,
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
      labelColumns: payload.l || [],
      groupBy:      payload.g || null,
    };
  } catch (e) {
    return null;
  }
}
