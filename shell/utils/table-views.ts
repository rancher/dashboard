import { get } from '@shell/utils/object';

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
