/**
 * Table Views - what a table's columns are, and how to read one off a row.
 *
 * A "field" is a column of the table seen as something the user can filter, group or sort by.
 * This is where a table's headers become fields, and where a field plus a row becomes a value -
 * including the value the server would filter on, which is not always the one the column shows.
 */

import { NAME, STATE } from '@shell/config/table-headers';
import { get } from '@shell/utils/object';
import { valueFor } from '@shell/utils/table-columns';
import type { PaginationHeaderOptions } from '@shell/core/types';
import type { TableViewColumn, TableViewField, TableViewRow, TableViewValueSuggestion } from '@shell/types/table-views';

export const LABEL_FIELD_PREFIX = 'label:';

/**
 * Fields the table itself depends on, so the user is not allowed to hide them.
 *
 * A row has to say what it is and how it is doing: without the name there is nothing to identify
 * or sort it by, and without the state there is no way to see that anything is wrong. Everything
 * else, age included, is the user's to turn off.
 */
export const CORE_FIELD_IDS = [STATE.name, NAME.name];

/**
 * The columns a table will not let go of, given the ones it shows by default.
 *
 * Whatever a row is identified by leads the table, so that is what cannot be hidden: state and
 * name where they lead, and otherwise simply the first column. An events list leads with its
 * state and carries a name further along, and the events on a detail page lead with when they
 * were last seen - neither has an identity column in the place the rest of the product puts it,
 * and both would be left showing nothing to recognise a row by.
 *
 * The column the table is ordered by is kept too, for the same sort of reason: an order the
 * reader cannot see the basis of looks like no order at all.
 */
export function coreFieldIdsFor(defaultColumnIds?: string[], sortedById?: string | null): string[] {
  const defaults = defaultColumnIds || [];
  const leading: string[] = [];

  for (const id of defaults) {
    if (!CORE_FIELD_IDS.includes(id)) {
      break;
    }

    leading.push(id);
  }

  const out = leading.length ? leading : defaults.slice(0, 1);

  // Whatever the table is ordered by stays as well - hiding it leaves the rows in an order
  // nothing on screen accounts for. On an events list that is when each was last seen.
  if (sortedById && defaults.includes(sortedById) && !out.includes(sortedById)) {
    out.push(sortedById);
  }

  return out;
}

/** Columns that are structural rather than data, so never offered as fields */
const IGNORED_COLUMNS = ['check', 'actions', 'spacer'];

/** Only scan this many rows when working out which labels/values are in use */
const SCAN_LIMIT = 1000;

/**
 * Read a value off a resource without throwing on odd paths (label keys contain dots)
 */
function safeGet(row: TableViewRow, path: string): unknown {
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
 * The paths a column can be read by, after the one the table itself uses.
 *
 * A column that draws itself entirely with a formatter carries `value: ''` - the cluster list's
 * CPU, Memory and Pods all do - so the table has nothing to read and shows the formatter's work
 * instead. Grouping and filtering still need a value, and the column's own sort or search path
 * is a real field on the row.
 *
 * Only the first entry of a `sort` list: the rest are tie breakers (commonly `metadata.name`)
 * and would give the column a nonsense value.
 */
function fallbackPath(header: TableViewColumn): string | null {
  if (typeof header.sort === 'string') {
    return header.sort.split(':')[0];
  }

  if (Array.isArray(header.sort) && typeof header.sort[0] === 'string') {
    return header.sort[0].split(':')[0];
  }

  if (typeof header.search === 'string' && header.search) {
    return header.search;
  }

  return null;
}

/**
 * The value of a field for a given row.
 *
 * Whatever the table would show in that cell comes first, read by the very function the table
 * reads its cells with - so a group heading, a filter and the cell above them cannot disagree
 * about what a row holds.
 *
 * What follows is the part a table never needs: a column the table draws without reading
 * anything still has to be groupable and filterable, so its sort or search path is tried, and
 * then any `getValue` it carries. Empty is the honest answer when none of that names a value.
 */
export function fieldValue(row: TableViewRow, field: TableViewField): unknown {
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

  // `warn: false` - the table complains about a column with no path because that is a broken
  // column; here every column of the type is asked about and some genuinely have nothing
  try {
    const shown = valueFor(row, header, false, { warn: false });

    if (shown !== undefined && shown !== null && shown !== '') {
      return shown;
    }
  } catch (e) {
    return '';
  }

  const path = fallbackPath(header);
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
export function rawFieldValue(row: TableViewRow, field: TableViewField): unknown {
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
export function stringifyValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map((v) => stringifyValue(v)).filter((v) => !!v).join(', ');
  }

  if (typeof value === 'object') {
    // Some columns hand back render objects, eg `{ label, color }`
    const { label } = value as { label?: unknown };

    if (typeof label === 'string') {
      return label;
    }

    return '';
  }

  return `${ value }`;
}

/**
 * Turn a header name into something usable as a query token
 */
export function headerFieldId(header: TableViewColumn): string {
  const name = header.name || header.label || '';

  return `${ name }`.replace(/\s+/g, '-').toLowerCase();
}

/**
 * True for the structural columns that aren't worth filtering or exporting
 */
export function isIgnoredColumn(header: TableViewColumn): boolean {
  return IGNORED_COLUMNS.includes(headerFieldId(header));
}

/**
 * Work out everything the user can filter/group/column by for this table.
 *
 * Columns come from the table headers, plus one synthetic field per label key found on
 * the rows - which is what lets someone add a column for their own custom label.
 *
 * `paginationHeaders` is the same set of columns as the pagination api defines them, passed only
 * when the list is server side paginated. It is what {@link serverPathFor} reads, so a column
 * carries both the definition it is drawn from and the one it is filtered by.
 */
export function fieldsFor(
  headers: TableViewColumn[],
  rows: TableViewRow[],
  t?: (key: string) => string,
  paginationHeaders?: PaginationHeaderOptions[] | null
): TableViewField[] {
  const out: TableViewField[] = [];
  const seen: Record<string, boolean> = {};

  // The same columns as the pagination api defines them, by field id. A paginated list is the
  // only one that can filter server side, and these are the only definitions that say how
  const byId: Record<string, PaginationHeaderOptions> = {};

  (paginationHeaders || []).forEach((header) => {
    const id = headerFieldId(header);

    if (id) {
      byId[id] = header;
    }
  });

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
      id, label, isLabel: false, header, paginationHeader: byId[id]
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

export function findField(fields: TableViewField[], id: string): TableViewField | undefined {
  if (!id) {
    return undefined;
  }

  const lower = id.toLowerCase();

  return fields.find((f) => f.id.toLowerCase() === lower);
}

/**
 * The steve/vai server-side path(s) to filter a field on, or null when the field has none.
 *
 * Two things have to be true for a column to be filtered by the api: the list is server side
 * paginated, and the column as that api defines it says what it is searched on. Both live in
 * `paginationHeader` - it is only attached to a paginated list's fields, and only the pagination
 * definitions carry `search`. Anything else has no server side representation and is filtered on
 * the rows instead.
 *
 * Nothing is inferred from `value` or `sort`. Those are display and ordering paths: a column's
 * `value` is as likely to be `stateDisplay` as `metadata.state.name`, and asking the api to
 * filter on the first returns nothing at all.
 */
export function serverPathFor(field: TableViewField): string | string[] | null {
  if (!field) {
    return null;
  }

  if (field.isLabel) {
    return field.labelKey ? `metadata.labels[${ field.labelKey }]` : null;
  }

  const search = field.paginationHeader?.search;

  if (typeof search === 'string' && search) {
    return search;
  }

  if (Array.isArray(search)) {
    // A column can name several paths - the cluster list's name is searched on `spec.displayName`
    // as well - and the empty entries among them are not paths
    const paths = search.filter((path: unknown) => typeof path === 'string' && path);

    return paths.length ? paths : null;
  }

  return null;
}

/** What the api answers a `summary=<field>&summaryonly` request with: how many rows hold each value */
interface SummaryResponse {
  summary?: { counts?: Record<string, { total?: number }> }[];
}

/**
 * Turn a steve `summary=<field>&summaryonly` response into value suggestions.
 *
 * The summary counts every row the type has, not just the page in front of us, so the values it
 * gives back are the real set in use. Most used first, so the suggestions are worth reading.
 */
export function summaryToValues(response: SummaryResponse | null | undefined, max = 50): TableViewValueSuggestion[] {
  const counts = response?.summary?.[0]?.counts || {};

  return Object.keys(counts)
    .map((value) => ({ value, count: counts[value]?.total ?? 0 }))
    .filter((entry) => !!entry.value)
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, max);
}

export function valuesInUse(rows: TableViewRow[], field: TableViewField, max = 25): TableViewValueSuggestion[] {
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
