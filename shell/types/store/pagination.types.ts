import { NAMESPACE_FILTER_NS_FULL_PREFIX, NAMESPACE_FILTER_P_FULL_PREFIX } from '@shell/utils/namespace-filter';

// Pagination Typing
// These structures are designed to offer both convenience and flexibility based on a common structure and are
// converted to the url param format as per https://github.com/rancher/steve.
//
// Simple use cases such as filtering by a single param should be easy to use.
// More complex filtering (and'ing and 'or'ing multiple fields) is also supported.
//
// The top level object `PaginationArgs` contains all properties that will be converted to url params
//
// The two important / complex params are currently
// - `filter` https://github.com/rancher/steve?tab=readme-ov-file#filter
//   - represented by `PaginationParamFilter extends PaginationParam`
//   - Examples
//     - filter=metadata.name=123
//     - filter=metadata.name=123,metadata.name=456 (name is 123 OR 456)
//     - filter=metadata.name=123&filter=metadata.namespace=abc (name 123 AND namespace abc)
// - `projectsornamespaces` https://github.com/rancher/steve?tab=readme-ov-file#projectsornamespaces
//   - represented by `PaginationParamProjectOrNamespace extends PaginationParam`
//   - Examples
//     - projectsornamespaces=123
//     - projectsornamespaces=123,456 (projects or namespaces that have id 123 OR 456)
//
//
// Some of the types below are defined using classes instead of TS types/interfaces
// - Avoid making complex json objects by using clearer instance constructors
//   - Better documented
//   - Defaults (a lot of the time convenience > utility)
// - Adds some kind of typing in pure js docs
//   - class ctor links to definition, instead of object just being a random json blob)
//   - helps VSCode jsdoc highlighting

/**
 * Sort the pagination result
 *
 * For more information regarding the API see https://github.com/rancher/steve?tab=readme-ov-file#sort
 */
export interface PaginationSort {
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
 * For more information regarding the API see https://github.com/rancher/steve?tab=readme-ov-file#query-parameters
 */
export class PaginationFilterField {
  /**
   * Name of field within the object to filter by for example the x of x=y
   *
   * This can be optional for some (projectsornamespaces)
   */
  field?: string;
  /**
   * Value of field within the object to filter by for example the y of x=y
   */
  value: string;
  /**
   * Equality field within the object to filter by for example the `=` or `!=` of x=y
   */
  equals: boolean;
  /**
   * Match the field exactly. False for partial matches
   *
   * Value: pod1
   * Exact: true. "p" no, "pod", no, "pod1" yes
   * Exact: false. "p" yes, "pod", yes, "pod1" yes
   */
  exact: boolean;

  constructor(
    {
      field, value, equals = true, exact = true
    }:
    { field?: string; value: string; equals?: boolean; exact?: boolean;}
  ) {
    this.field = field;
    this.value = value;
    this.equals = equals;
    this.exact = exact;
  }
}

/**
 * Represents filter like params, for example
 *
 * - `filter=abc!=xyz&def=123`
 * - `projectsornamespace!=p-3456`
 *
 * ### Params
 * #### Filter
 * - For more information regarding the API see https://github.com/rancher/steve?tab=readme-ov-file#filter
 *
 * #### Projects Or Namespace
 * - For more information regarding the API see https://github.com/rancher/steve?tab=readme-ov-file#projectsornamespaces
 *
 * ### Combining Params
 * Params can be combined in two logical ways
 *
 * 1) AND
 *    - Used when you would like to filter by something like a=1 AND b=2 AND c=3
 *    - To do this multiple instances of `PaginationParam` are used in an array
 *      - Object Structure
 *        ```
 *        [
 *          PaginationParam,
 *          PaginationParam,
 *          PaginationParam
 *        ]
 *        ```
 *      - Results in url
 *        ```
 *        filter=a=1&filter=b=2&filter=c=3
 *        ```
 *      - Examples
 *        - `filter=metadata.namespace=abc&filter=metadata.name=123,property=123`
 * 2) OR
 *    - Used when you would like to filter by something like a=1 OR b=2 OR c=3
 *    - To do this multiple fields within a single PaginationParam is used
 *      - Object Structure
 *        ```
 *        [
 *          PaginationParam {
 *            PaginationFilterField,
 *            PaginationFilterField,
 *            PaginationFilterField
 *          }
 *        ]
 *        ```
 *      - Results in url
 *        ```
 *        filter=a=1,b=2,c=3
 *        ```
 *
 *      - For example `filter=a=1,b=2,c=3`
 *
 *
 * This structure should give enough flexibility to cover all uses.
 *
 *
 */
export abstract class PaginationParam {
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
  fields: PaginationFilterField[];

  constructor(
    { param, equals = true, fields = [] }:
    {
      param: string;
      /**
       * should param equal fields
       *
       * For definition see {@link PaginationParam} `equals`
       */
      equals?: boolean;
      /**
       * Collection of fields to filter by
       *
       * For definition see {@link PaginationParam} `fields`
       */
      fields?: PaginationFilterField[];
  }) {
    this.param = param;
    this.equals = equals;
    this.fields = fields;
  }
}

/**
 * This is a convenience class for the `filter` param which works some magic, adds defaults and converts to the required PaginationParam format
 *
 * See description for {@link PaginationParam} for how multiple of these can be combined together to AND or OR together
 *
 * For more information regarding the API see https://github.com/rancher/steve?tab=readme-ov-file#filter
 */
export class PaginationParamFilter extends PaginationParam {
  constructor(
    { equals = true, fields = [] }:
    {
      /**
       * should param equal fields
       *
       * For definition see {@link PaginationParam} `equals`
       */
      equals?: boolean;
      /**
       * Collection of fields to filter by.
       *
       * Fields are ORd together
       *
       * For definition see {@link PaginationParam} `fields`
       */
      fields?: PaginationFilterField[];
    }
  ) {
    super({
      param: 'filter',
      equals,
      fields
    });
  }

  /**
   * Convenience method when you just want an instance of {@link PaginationParamFilter} with a simple `filter=x=y` param
   */
  static createSingleField(field: { field?: string; value: string; equals?: boolean; exact?: boolean }): PaginationParam {
    return new PaginationParamFilter({ fields: [new PaginationFilterField(field)] });
  }

  /**
   * Convenience method when you just want an instance of {@link PaginationParamFilter} with a simple `filter=a=1,b=2,c=3` PaginationParam
   *
   * These will be OR'd together
   */
  static createMultipleFields(fields: PaginationFilterField[]): PaginationParam {
    return new PaginationParamFilter({ fields });
  }
}

/**
 * This is a convenience class for the `projectsornamespaces` param which works some magic, adds defaults and converts to the required PaginationParam format
 *
 * See description for {@link PaginationParam} for how multiple of these can be combined together to AND or OR together
 *
 * For more information regarding the API see https://github.com/rancher/steve?tab=readme-ov-file#projectsornamespaces
 */
export class PaginationParamProjectOrNamespace extends PaginationParam {
  constructor(
    { equals = true, projectOrNamespace = [] }:
    {
      /**
       * should param equal fields
       * For definition see {@link PaginationParam} `equals`
       */
      equals?: boolean;
       /**
       * Collection of projects / namespace id's to filter by
       *
       * These are OR'd together
       *
       * For clarification on definition see {@link PaginationFilterField}
       */
      projectOrNamespace?: string[];
    }
  ) {
    const safeFields = projectOrNamespace.map((f) => {
      return new PaginationFilterField({
        value: f
          .replace(NAMESPACE_FILTER_NS_FULL_PREFIX, '')
          .replace(NAMESPACE_FILTER_P_FULL_PREFIX, '')
      });
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
 *
 * Use this for making pagination requests that utilise the new vai cache backed API
 */
export class PaginationArgs {
  /**
   * Page number to fetch
   */
  page: number | null;
  /**
   * Number of results in the page
   */
  pageSize?: number | null;
  /**
   * Sort the results
   *
   * For more info see {@link PaginationSort}
   */
  sort: PaginationSort[];
  /**
   * A collection of `filter` params
   *
   * For more info see {@link PaginationParamFilter}
   */
  filters: PaginationParamFilter[];
  /**
   * A collection of `projectsornamespace` params
   *
   * For more info see {@link PaginationParamProjectOrNamespace}
   */
  projectsOrNamespaces: PaginationParamProjectOrNamespace[];

  /**
   * Creates an instance of PaginationArgs.
   *
   * Contains defaults to avoid creating complex json objects all the time
   */
  constructor({
    page = 1,
    pageSize = 10,
    sort = [],
    filters = [],
    projectsOrNamespaces = [],
  }:
  // This would be neater as just Partial<PaginationArgs> but we lose all jsdoc
  {
    /**
     * For definition see {@link PaginationArgs} `page`
     */
    page?: number | null,
    /**
     * For definition see {@link PaginationArgs} `pageSize`
     */
    pageSize?: number | null,
    /**
     * For definition see {@link PaginationArgs} `sort`
     */
    sort?: PaginationSort[],
    /**
     * Automatically wrap if not an array
     *
     * For definition see {@link PaginationArgs} `filters`
     */
    filters?: PaginationParamFilter | PaginationParamFilter[],
    /**
     * Automatically wrap if not an array
     *
     * For definition see {@link PaginationArgs} `projectsOrNamespaces`
     */
    projectsOrNamespaces?: PaginationParamProjectOrNamespace | PaginationParamProjectOrNamespace[],
  }) {
    this.page = page;
    this.pageSize = pageSize;
    this.sort = sort;
    if (filters) {
      this.filters = Array.isArray(filters) ? filters : [filters];
    } else {
      this.filters = [];
    }
    if (projectsOrNamespaces) {
      this.projectsOrNamespaces = Array.isArray(projectsOrNamespaces) ? projectsOrNamespaces : [projectsOrNamespaces];
    } else {
      this.projectsOrNamespaces = [];
    }
  }
}

/**
 * Wrapper around {@link PaginationArgs}
 *
 * Use this for making requests that utilise filtering backed by the new vai cache backed API
 */
export class FilterArgs extends PaginationArgs {
  /**
     * Creates an instance of PaginationArgs.
     *
     * Contains defaults to avoid creating complex json objects all the time
     */
  constructor({
    sort = [],
    filters = [],
    projectsOrNamespaces = [],
  }:
  // This would be neater as just Partial<PaginationArgs> but we lose all jsdoc
  {
    /**
     * For definition see {@link PaginationArgs} `sort`
     */
    sort?: PaginationSort[],
    /**
     * Automatically wrap if not an array
     *
     * For definition see {@link PaginationArgs} `filters`
     */
    filters?: PaginationParamFilter | PaginationParamFilter[],
    /**
     * Automatically wrap if not an array
     *
     * For definition see {@link PaginationArgs} `projectsOrNamespaces`
     */
    projectsOrNamespaces?: PaginationParamProjectOrNamespace | PaginationParamProjectOrNamespace[],
  }) {
    super({
      page: null, pageSize: null, sort, filters, projectsOrNamespaces
    });
  }
}

/**
 * Overall result of a pagination request.
 *
 * Does not contain actual resources but overall stats (count, pages, etc)
 */
export interface StorePaginationResult {
  count: number,
  pages: number,
  /**
   * The last time the resource was updated. Used to assist list watching for changes
   */
  timestamp: number,
}

export interface StorePaginationRequest {
  /**
   * The single namespace to filter results by (as part of url path, not pagination params)
   */
  namespace?: string,
  /**
   * The set of pagination args used to create the request
   */
  pagination: PaginationArgs
}

/**
 * Pagination settings
 * - what was requested
 * - what was received (minus actual resources)
 *
 * Object is persisted to store
 */
export interface StorePagination {
  /**
   * Collection of args that is used to make the request
   */
  request: StorePaginationRequest,

  /**
   * Information in the response outside of the actual resources returned
   */
  result: StorePaginationResult
}

/**
 * The resource and context that the pagination request will be used
 *
 * Used to determine if the request is supported
*/
export interface PaginationResourceContext {
  store: string,
  resource?: {
    id: string,
    context?: string,
  }
}
