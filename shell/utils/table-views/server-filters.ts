/**
 * Table Views - turning a query into pagination filters.
 *
 * The server-side half of filtering. A term becomes a `PaginationParamFilter` the steve API can
 * apply; a term it cannot apply is reported back rather than dropped, so the toolbar can say the
 * query did not entirely run.
 */

import {
  PaginationParamFilter,
  PaginationFilterField,
  PaginationFilterEquality,
} from '@shell/types/store/pagination.types';
import { findField, serverPathFor } from '@shell/utils/table-views/fields';
import type { ServerFilterResult, ViewField, ViewQuery, ViewTerm } from '@shell/types/table-views';

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
