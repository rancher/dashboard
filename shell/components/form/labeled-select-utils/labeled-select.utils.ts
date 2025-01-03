import { LabelSelectPaginateFnOptions, LabelSelectPaginateFnResponse } from '@shell/types/components/labeledSelect';
import { PaginationArgs, PaginationParam, PaginationSort } from '@shell/types/store/pagination.types';

export interface LabelSelectPaginationFunctionOptions<T = any> {
  opts: LabelSelectPaginateFnOptions<T>,
  /**
   * Resource type
   */
  type: string,
  /**
   * Store things
   */
  ctx: { getters: any, dispatch: any}
  /**
   * Filters to apply. This mostly covers the text a user has entered, but could be other things like namespace
   */
  filters?: PaginationParam[],
  /**
   * How to sort the response
   */
  sort?: PaginationSort[],
  /**
   * Vuex store name
   */
  store?: string,
  /**
   * True if the options returned should be grouped by namespace
   */
  groupByNamespace?: boolean,

  /**
   * Convert the results from JSON object to Rancher model class instance
   */
  classify?: boolean,
}

/**
 * This is a helper function to cover common functionality that could happen when a LabelSelect requests a new page
 */
export async function labelSelectPaginationFunction<T>({
  opts,
  type,
  ctx,
  filters = [],
  sort = [{ asc: true, field: 'metadata.namespace' }, { asc: true, field: 'metadata.name' }],
  store = 'cluster',
  groupByNamespace = true,
  classify = false,
}: LabelSelectPaginationFunctionOptions<T>): Promise<LabelSelectPaginateFnResponse<T>> {
  const {
    pageContent, page, pageSize, resetPage
  } = opts;

  try {
    // Construct params for request

    const pagination = new PaginationArgs({
      page,
      pageSize,
      sort,
      filters
    });
    const url = ctx.getters[`${ store }/urlFor`](type, null, { pagination });
    // Make request (note we're not bothering to persist anything to the store, response is transient)
    const res = await ctx.dispatch(`${ store }/request`, { url });
    let data = res.data;

    if (classify) {
      data = await ctx.dispatch('cluster/createMany', data);
    }

    const options = resetPage ? data : pageContent.concat(data);

    // Create the new option collection by...
    let resPage: any[];

    if (groupByNamespace) {
      // ... grouping by namespace
      const namespaced: { [ns: string]: T[]} = {};

      options.forEach((option: any) => {
        const ns = option.metadata.namespace;

        if (option.kind === 'group') { // this could contain a previous option set which contains groups
          return;
        }
        if (!namespaced[ns]) {
          namespaced[ns] = [];
        }
        namespaced[ns].push(option);
      });

      resPage = [];

      // ... then sort groups by name and combined into a single array
      Object.keys(namespaced).sort().forEach((ns) => {
        resPage.push({
          kind:     'group',
          icon:     'icon-namespace',
          id:       ns,
          metadata: { name: ns },
          disabled: true,
        });
        resPage = resPage.concat(namespaced[ns]);
      });
    } else {
      resPage = options;
    }

    return {
      page:  resPage,
      pages: res.pages || Math.ceil(res.count / (pageSize || Number.MAX_SAFE_INTEGER)),
      total: res.count
    };
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
  }

  return {
    page: [], pages: 0, total: 0
  };
}
