/**
 * Table Views - the shapes the query/column/group/export engine passes around.
 *
 * The engine itself is under @shell/utils/table-views; everything it hands back or takes in is
 * described here, so a caller can name a shape without pulling the engine in with it.
 */

import { PaginationParamFilter } from '@shell/types/store/pagination.types';

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

/** The state a table's toolbar edits and the table applies - a saved view without its identity */
export type ViewState = Omit<SavedView, 'id' | 'name'>;

/**
 * One of a table's bulk actions, as the table hands them out.
 *
 * `icon` is a font class and `svg` a file an extension supplied; a given action has one or the
 * other. `enabled` is false when the action exists but cannot be run on what is selected.
 */
export interface TableAction {
  action: string;
  label?: string;
  icon?: string;
  svg?: string;
  enabled?: boolean;
}

export interface QueryToken {
  start: number;
  end: number;
  text: string;
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
 * `value` is a value the field actually has; `value-unknown` is one it does not - typed by hand,
 * or half typed. Only the first is worth dressing up as a badge.
 */
export type QuerySegmentKind = 'field' | 'value' | 'value-unknown' | 'connective' | 'text' | 'plain';

export interface QuerySegment {
  text: string;
  kind: QuerySegmentKind;
}

/** Something in the query that stops it meaning what it says */
export type QueryProblemKind =
  'emptyValue' | 'trailingOperator' | 'leadingJoiner' | 'consecutiveOperators' |
  'danglingNegation' | 'unbalancedQuote' | 'noTerms';

export interface QueryProblem {
  kind: QueryProblemKind;
  /** Where the offending text sits, so the box can mark it as well as describe it */
  start: number;
  end: number;
  text: string;
  /** The field's name as the user knows it, for the ones that are about a field */
  label?: string;
}

export interface ServerFilterResult {
  filters: PaginationParamFilter[];
  unsupported: ViewTerm[];
}

export interface ValueSuggestion {
  value: string;
  count: number;
}

/**
 * The values currently in use for a field, most common first.
 *
 * This is what powers the "start typing a field and see the values that
 * exist in the data" autocomplete.
 */

export interface ExportColumn {
  label: string;
  field: ViewField;
}
