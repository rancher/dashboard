/** The shapes the table views engine (@shell/utils/table-views) takes and returns */

import type { HeaderOptions, PaginationHeaderOptions } from '@shell/core/types';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';

/** A table row. Any resource can be one, so only the labels a view reads directly are typed */
export interface TableViewRow {
  metadata?: {
    labels?: Record<string, string>;
    [key: string]: unknown;
  };
}

/** A table column: the extension header shape, plus a `value` that can be a function */
export interface TableViewColumn extends Omit<HeaderOptions, 'value'> {
  value?: string | ((row: TableViewRow) => unknown);
}

export interface TableViewField {
  /** Token used in the query, eg `namespace` or `label:app` */
  id: string;
  label: string;
  isLabel: boolean;
  labelKey?: string;
  /** Holds moments in time: filtered and suggested as dates, grouped by only by month */
  isDate?: boolean;
  /** The Group By entry that gathers a date column's rows by the month they fall in */
  byMonth?: boolean;
  header?: TableViewColumn;
  /**
   * The column as a paginated list defines it. Only this one says how the api searches it, and it
   * is absent when the list can't be filtered server side
   */
  paginationHeader?: PaginationHeaderOptions;
}

export interface TableViewTerm {
  /** Field id, or null for free text */
  field: string | null;
  value: string;
  negated: boolean;
}

/** Terms with no joining word between them: the same field means either, different fields mean both */
export type TableViewGroup = TableViewTerm[];

export interface TableViewClause {
  groups: TableViewGroup[];
}

/** Clauses joined by `or`. `and` binds tighter, so `a or b and c` is `a or (b and c)` */
export interface TableViewQuery {
  clauses: TableViewClause[];
}

export interface TableViewSaved {
  id: string;
  name: string;
  query: string;
  /** null means the table's default columns */
  columns: string[] | null;
  /** null means the table's own order */
  columnOrder?: string[] | null;
  labelColumns: string[];
  groupBy: string | null;
  /** null means the table's own sort */
  sort?: string | null;
  sortDescending?: boolean;
}

export type TableViewState = Omit<TableViewSaved, 'id' | 'name'>;

export interface TableViewAction {
  action: string;
  label?: string;
  icon?: string;
  svg?: string;
  enabled?: boolean;
}

export interface TableViewQueryToken {
  start: number;
  end: number;
  text: string;
}

/**
 * A term resolved against the fields and located in the text. `state: active` spans two chunks, so
 * the autocomplete and highlighter need this rather than raw tokens
 */
export interface TableViewQueryTerm extends TableViewQueryToken {
  kind: 'term' | 'connective';
  /** The `-` or `!` prefix, if any. Empty for a spelled out `not`, which is its own token */
  negate: string;
  negated: boolean;
  field: TableViewField | null;
  fieldText: string;
  value: string;
  valueStart: number;
}

/** `value-unknown` is a value the field doesn't have, eg one half typed */
export type TableViewQuerySegmentKind = 'field' | 'value' | 'value-unknown' | 'connective' | 'text' | 'plain';

export interface TableViewQuerySegment {
  text: string;
  kind: TableViewQuerySegmentKind;
}

export type TableViewQueryProblemKind =
  'emptyValue' | 'trailingOperator' | 'leadingJoiner' | 'consecutiveOperators' |
  'danglingNegation' | 'unbalancedQuote' | 'noTerms';

export interface TableViewQueryProblem {
  kind: TableViewQueryProblemKind;
  start: number;
  end: number;
  text: string;
  label?: string;
}

export interface TableViewServerFilterResult {
  filters: PaginationParamFilter[];
  unsupported: TableViewTerm[];
}

export interface TableViewValueSuggestion {
  value: string;
  count: number;
}

export interface TableViewExportColumn {
  label: string;
  field: TableViewField;
}
