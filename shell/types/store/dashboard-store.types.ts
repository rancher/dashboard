import { NAMESPACE_FILTER_NS_FULL_PREFIX, NAMESPACE_FILTER_P_FULL_PREFIX } from '@shell/utils/namespace-filter';

/**
 * Sort the pagination result
 *
 * For more information see https://github.com/rancher/steve?tab=readme-ov-file#sort
 */
export interface OptPaginationSort {
  /**
   * Name of field within the object to sort by
   */
  field: string,
  asc: boolean
}

/**
 * Filter the pagination result by these specific fields
 *
 * For example
 *
 * - metadata.name=test
 * - metadata.namespace!=system
 *
 * For more information see https://github.com/rancher/steve?tab=readme-ov-file#query-parameters
 */
export class OptPaginationFilterField {
  /**
   * Name of field within the object to sort by
   *
   * This can be optional for some (projectsornamespaces)
   */
  field?: string;
  value: string;
  equals: boolean;

  constructor(
    { field, value, equals = true }:
    { field?: string; value: string; equals?: boolean; }
  ) {
    this.field = field;
    this.value = value;
    this.equals = equals;
  }
}

/**
 * Filter the pagination result by a number of fields
 *
 * OptPaginationFilter can be used in two ways
 *
 * 1) OR'd together
 *  - a=1 OR b=2 OR c=3
    - Query Param - filter=a=1,b=2,c=3
 *  - Object structure - [
 *      [a,1],[b,2],[c,3]
 *    ]
 *
 * 2) AND'd together
  *- a=1 AND b=2 AND c=3
 *  - Query Param - filter=a=1&filter=b=2&filter=c=3
 *  - Object structure - [
 *      [a,1]
 *    ],
 *    [
 *      [b,2]
 *    ],
 *    [
 *      [c,3]
 *    ]
 *
 * This structure should give enough flexibility to cover all uses
 *
 * For more information see https://github.com/rancher/steve?tab=readme-ov-file#filter
 */
export class OptPaginationFilter {// implements OptPaginationFilter
  /**
   * Query Param. For example `filter` or `projectsornamespaces`
   */
  param: string;
  /**
   * should fields equal param.
   *
   * For example projectsornamexspaces=x or projectsornamexspaces!=x
   */
  equals: boolean;
  /**
   * Fields to filter by
   *
   * For example metadata.namespace=abc OR metadata.namespace=xyz
   */
  fields: OptPaginationFilterField[];

  constructor(
    { param = 'filter', equals = true, fields = [] }:
    { param?: string; equals?: boolean; fields?: OptPaginationFilterField[];
  }) {
    this.param = param;
    this.equals = equals;
    this.fields = fields;
  }
}

/**
 * This is a convenience class which works some magic, adds defaults and converts to the required OptPaginationFilter format
 *
 * For more information see https://github.com/rancher/steve?tab=readme-ov-file#projectsornamespaces
 */
export class OptPaginationProjectOrNamespace extends OptPaginationFilter {
  constructor(
    { equals = true, fields = [] }:
    { equals?: boolean; fields?: OptPaginationFilterField[]; }
  ) {
    const safeFields = fields.map((f) => {
      return {
        ...f,
        value: f.value
          .replace(NAMESPACE_FILTER_NS_FULL_PREFIX, '')
          .replace(NAMESPACE_FILTER_P_FULL_PREFIX, '')
      };
    });

    super({
      param:  'projectsornamespaces',
      equals,
      fields: safeFields
    });
  }
}

/**
 * Pagination settings sent to actions and persisted to store
 */
export interface OptPagination {
  page: number,
  pageSize: number,
  sort: OptPaginationSort[],
  filter: OptPaginationFilter[],
  projectsOrNamespaces: OptPaginationFilter[],
}

/**
 * Object persisted to store
 */
export interface StorePagination {
  /**
   * This set of pagination settings that created the result
   */
  request: OptPagination,
  /**
   * Information in the response outside of the actual resources returned
   */
  result: {
    count: number,
    pages: number
  }
}

export type CoreFindOpt = {
  type: string,
  force?: boolean,
}

/**
 * Args used for findAll action
 */
export interface FindAllOpt extends CoreFindOpt {
  watch?: boolean,
  namespaced?: string[],
  incremental?: boolean,
  hasManualRefresh?: boolean,
  limit?: number,
}

/**
 * Args used for findPage action
 */
export interface FindPageOpt extends CoreFindOpt {
  pagination: OptPagination,
  hasManualRefresh?: boolean,
}
