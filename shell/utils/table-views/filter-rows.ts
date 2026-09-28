/**
 * Table Views - applying a query to the rows in hand.
 *
 * The client-side half of filtering, for lists that are not paginated by the server and for the
 * rows already on the page. What the server does with the same query is in ./server-filters.
 */

import { fieldValue, findField, rawFieldValue, stringifyValue } from '@shell/utils/table-views/fields';
import type { TableViewField, TableViewGroup, TableViewQuery, TableViewTerm } from '@shell/types/table-views';

/**
 * Does this field on this row contain `needle`?
 *
 * Both the shown value and the filterable one count, so the same query behaves the same way
 * client-side and server-side: `state:active` has to match the row whose column reads "Active",
 * and someone typing what they can see, `state:Act`, has to match it too.
 */
function fieldContains(row: any, field: TableViewField, needle: string): boolean {
  if (stringifyValue(fieldValue(row, field)).toLowerCase().includes(needle)) {
    return true;
  }

  return stringifyValue(rawFieldValue(row, field)).toLowerCase().includes(needle);
}

function matchesTerm(row: any, term: TableViewTerm, fields: TableViewField[]): boolean {
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
 * (`state:error state:crash` = either).
 */
function matchesGroup(row: any, terms: TableViewGroup, fields: TableViewField[]): boolean {
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

/**
 * Apply a whole query: any clause matching keeps the row, and a clause matches when every one
 * of its groups does.
 */
export function applyQueryExpression(rows: any[], query: TableViewQuery, fields: TableViewField[]): any[] {
  const clauses = query?.clauses || [];

  if (!clauses.length) {
    return rows;
  }

  return rows.filter((row) => clauses.some((clause) => clause.groups.every((group) => matchesGroup(row, group, fields))));
}

/**
 * Apply a flat list of terms - a query with no joining words in it, which is one group.
 */
export function applyQuery(rows: any[], terms: TableViewTerm[], fields: TableViewField[]): any[] {
  if (!terms.length) {
    return rows;
  }

  return applyQueryExpression(rows, { clauses: [{ groups: [terms] }] }, fields);
}
