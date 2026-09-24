/**
 * Table Views - what a table's columns are, and how to read one off a row.
 *
 * A "field" is a column of the table seen as something the user can filter, group or sort by.
 * This is where a table's headers become fields, and where a field plus a row becomes a value -
 * including the value the server would filter on, which is not always the one the column shows.
 */

import { get } from '@shell/utils/object';
import type { ValueSuggestion, ViewField } from '@shell/types/table-views';

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

  // A non-empty one. A column drawn entirely by a formatter carries `value: ''` - the cluster
  // list's CPU, Memory and Pods do - and taking that as the path stopped the fall through to the
  // sort path below, which is a real field the row does have.
  if (typeof header.value === 'string' && header.value) {
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
  if (typeof header?.search === 'string' && header.search) {
    return header.search;
  }

  if (Array.isArray(header?.search)) {
    const paths = header.search.filter((path: unknown) => typeof path === 'string' && path);

    if (paths.length) {
      return paths;
    }
  }

  // Then the handful of ids we know the canonical path for, which covers the columns that say
  // nothing about how to search them
  if (SERVER_PATH_SAFETY_NET[field.id]) {
    return SERVER_PATH_SAFETY_NET[field.id];
  }

  if (!header) {
    return null;
  }

  // Only a path that actually names something. A column drawn entirely by a formatter carries
  // `value: ''` - the cluster list's CPU, Memory and Pods all do - and handing that back as a
  // path had them offered as things the list could be filtered by, on a filter naming no field
  // at all.
  if (typeof header.value === 'string' && header.value) {
    return header.value;
  }

  if (typeof header.sort === 'string') {
    // `sort` can carry a `:desc` style suffix, only the path is useful for filtering
    return header.sort.split(':')[0];
  }

  return null;
}

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
