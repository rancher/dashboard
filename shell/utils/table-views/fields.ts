
import { NAME, STATE } from '@shell/config/table-headers';
import { get } from '@shell/utils/object';
import { valueFor } from '@shell/utils/table-columns';
import type { PaginationHeaderOptions } from '@shell/core/types';
import type { TableViewColumn, TableViewField, TableViewRow, TableViewValueSuggestion } from '@shell/types/table-views';

export const LABEL_FIELD_PREFIX = 'label:';

/** Columns the user can't hide: without them a row can't be identified or its health seen */
export const CORE_FIELD_IDS = [STATE.name, NAME.name];

/**
 * The columns a table won't let go of: the leading state and name, else the first column, plus the
 * one it's sorted by
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

  if (sortedById && defaults.includes(sortedById) && !out.includes(sortedById)) {
    out.push(sortedById);
  }

  return out;
}

const IGNORED_COLUMNS = ['check', 'actions', 'spacer'];

const SCAN_LIMIT = 1000;

/** Label keys contain dots, which `get` would read as a path */
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
 * A column drawn entirely by a formatter has `value: ''`, so grouping and filtering fall back to
 * its sort or search path. Only the first `sort` entry: the rest are tie breakers
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
 * A field's value for a row: what its cell shows first, so a group heading, a filter and the cell
 * always agree
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

  // Some columns genuinely have no path, so no warning
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
 * The value the api filters on, which can differ from the one shown: `state` shows "Active" but
 * filters on "active"
 */
export function rawFieldValue(row: TableViewRow, field: TableViewField): unknown {
  if (!row || !field || field.isLabel) {
    return fieldValue(row, field);
  }

  const path = serverPathFor(field);
  // The first path is the column's own value; the rest are extras
  const first = Array.isArray(path) ? path[0] : path;

  if (typeof first === 'string') {
    const out = safeGet(row, first);

    if (out !== undefined && out !== null && out !== '') {
      return out;
    }
  }

  return fieldValue(row, field);
}

export function stringifyValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map((v) => stringifyValue(v)).filter((v) => !!v).join(', ');
  }

  if (typeof value === 'object') {
    // Some columns return render objects, eg `{ label, color }`
    const { label } = value as { label?: unknown };

    if (typeof label === 'string') {
      return label;
    }

    return '';
  }

  return `${ value }`;
}

export function headerFieldId(header: TableViewColumn): string {
  const name = header.name || header.label || '';

  return `${ name }`.replace(/\s+/g, '-').toLowerCase();
}

export function isIgnoredColumn(header: TableViewColumn): boolean {
  return IGNORED_COLUMNS.includes(headerFieldId(header));
}

/**
 * Everything a table can be filtered, grouped or shown by: its columns, plus one field per label
 * key on the rows. `paginationHeaders` is passed only for a server side paginated list - see
 * serverPathFor
 */
export function fieldsFor(
  headers: TableViewColumn[],
  rows: TableViewRow[],
  t?: (key: string) => string,
  paginationHeaders?: PaginationHeaderOptions[] | null
): TableViewField[] {
  const out: TableViewField[] = [];
  const seen: Record<string, boolean> = {};

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
 * The api path(s) to filter a field on, or null to filter it on the rows instead. Only the
 * paginated definition's `search` is trusted: `value` is as likely to be a display value the api
 * doesn't know
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
    // Eg the cluster list's name is also searched on `spec.displayName`
    const paths = search.filter((path: unknown) => typeof path === 'string' && path);

    return paths.length ? paths : null;
  }

  return null;
}

interface SummaryResponse {
  summary?: { counts?: Record<string, { total?: number }> }[];
}

/** Value suggestions from a steve summary, which counts every row rather than just this page */
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
