
import {
  dateText, fieldValue, findField, rawFieldValue, stringifyValue
} from '@shell/utils/table-views/fields';
import type {
  TableViewField, TableViewGroup, TableViewQuery, TableViewRow, TableViewTerm
} from '@shell/types/table-views';

/**
 * Both the shown and the filterable value count, so `state:Act` and `state:active` match client and
 * server side alike
 */
function fieldContains(row: TableViewRow, field: TableViewField, needle: string): boolean {
  // A date matches as a date, however the row happens to hold it
  const text = field.isDate ? dateText : stringifyValue;

  if (text(fieldValue(row, field)).toLowerCase().includes(needle)) {
    return true;
  }

  return text(rawFieldValue(row, field)).toLowerCase().includes(needle);
}

function matchesTerm(row: TableViewRow, term: TableViewTerm, fields: TableViewField[]): boolean {
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

/** Different fields AND'd, repeated terms for one field OR'd */
function matchesGroup(row: TableViewRow, terms: TableViewGroup, fields: TableViewField[]): boolean {
  const positive: Record<string, TableViewTerm[]> = {};
  const negative: TableViewTerm[] = [];

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

export function applyQueryExpression<T extends TableViewRow>(rows: T[], query: TableViewQuery, fields: TableViewField[]): T[] {
  const clauses = query?.clauses || [];

  if (!clauses.length) {
    return rows;
  }

  return rows.filter((row) => clauses.some((clause) => clause.groups.every((group) => matchesGroup(row, group, fields))));
}

export function applyQuery<T extends TableViewRow>(rows: T[], terms: TableViewTerm[], fields: TableViewField[]): T[] {
  if (!terms.length) {
    return rows;
  }

  return applyQueryExpression(rows, { clauses: [{ groups: [terms] }] }, fields);
}
