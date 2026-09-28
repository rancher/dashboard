
import {
  PaginationParamFilter,
  PaginationFilterField,
  PaginationFilterEquality,
} from '@shell/types/store/pagination.types';
import { findField, serverPathFor } from '@shell/utils/table-views/fields';
import type { TableViewServerFilterResult, TableViewField, TableViewQuery, TableViewTerm } from '@shell/types/table-views';

/**
 * Terms as steve `filter=` params: each value a CONTAINS match, several on one field OR'd.
 * Different fields are AND'd. Terms with no server path are returned as `unsupported`, not applied
 */
export function termsToServerFilters(terms: TableViewTerm[], fields: TableViewField[]): TableViewServerFilterResult {
  const filters: PaginationParamFilter[] = [];
  const unsupported: TableViewTerm[] = [];

  if (!terms || !terms.length) {
    return { filters, unsupported };
  }

  const allowedPathsFor = (fieldId: string): string[] | null => {
    const field = findField(fields, fieldId);

    if (!field) {
      return null;
    }

    const raw = serverPathFor(field);

    if (!raw) {
      return null;
    }

    const paths = (Array.isArray(raw) ? raw : [raw]).filter((p) => typeof p === 'string');

    return paths.length ? paths : null;
  };

  // Label columns are left out: each costs the api a join, and OR'ing several hangs it. So are the
  // columns that say they aren't searched
  const freeTextPaths: string[] = [];
  const seenPath: Record<string, boolean> = {};

  fields.forEach((field) => {
    if (field.isLabel || field.paginationHeader?.search === false) {
      return;
    }

    const raw = serverPathFor(field);

    if (!raw) {
      return;
    }

    (Array.isArray(raw) ? raw : [raw]).forEach((p) => {
      if (typeof p === 'string' && !seenPath[p]) {
        seenPath[p] = true;
        freeTextPaths.push(p);
      }
    });
  });

  const groups: Record<string, TableViewTerm[]> = {};
  const order: string[] = [];
  const freeText: TableViewTerm[] = [];

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

    // One value or several, a field term is a contains match, so `a b` on one field means `a or b`
    if (negated) {
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

  freeText.forEach((term) => {
    if (!freeTextPaths.length) {
      unsupported.push(term);

      return;
    }

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

/** How many params an `or` may expand into before the query is reported instead of sent */
const MAX_OR_FILTERS = 16;

function allTerms(query: TableViewQuery): TableViewTerm[] {
  return (query?.clauses || []).reduce((acc: TableViewTerm[], clause) => acc.concat(...clause.groups), []);
}

/**
 * A whole query as `filter=` params. Params are AND'd and the fields within one OR'd, so `or` is
 * expanded: `(a and b) or c` is `(a or c) and (b or c)`. When that can't be done nothing is
 * filtered and every term is reported, rather than narrowing by half the query
 */
export function queryToServerFilters(query: TableViewQuery, fields: TableViewField[]): TableViewServerFilterResult {
  const clauses = query?.clauses || [];

  if (!clauses.length) {
    return { filters: [], unsupported: [] };
  }

  const unsupported: TableViewTerm[] = [];
  const perClause = clauses.map((clause) => {
    const filters: PaginationParamFilter[] = [];

    clause.groups.forEach((group) => {
      const result = termsToServerFilters(group, fields);

      filters.push(...result.filters);
      unsupported.push(...result.unsupported);
    });

    return filters;
  });

  if (perClause.length === 1) {
    return { filters: perClause[0], unsupported };
  }

  // Narrowing by the other side alone would hide rows this side asked for
  if (perClause.some((filters) => !filters.length)) {
    return { filters: [], unsupported: allTerms(query) };
  }

  if (perClause.reduce((acc, filters) => acc * filters.length, 1) > MAX_OR_FILTERS) {
    return { filters: [], unsupported: allTerms(query) };
  }

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
