import { COUNT } from '@shell/config/types';
import { KubeLabelSelector } from '@shell/types/kube/kube-api';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';
import { FilterArgs, PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';
import { isEmpty } from '@shell/utils/object';
import { convert, matching as rootMatching } from '@shell/utils/selector';

/**
 * Find resources that match a labelSelector. This behaves differently if vai based pagination is on
 * a) Pagination Enabled - fetch matching resources filtered on backend - findPage
 * b) Pagination Disabled - fetch all resources and then filter locally - findAll --> root `matching` fn
 *
 * This is a much smarter version of root matching fn `matching` from shell/utils/selector.js  (which just does local filtering)
 *
  * If fetching all of a resource should be avoided or we don't want to mess around with the cache the action `findLabelSelector` should be used
 * - sometimes some legacy code expects all resources are fetched
 * - sometimes we want to fetch a resource but not override the cache
 *   - already have a pods list cached, don't want to overwrite that when finding pods associated with a service
 *
 * Resources are returned in a common format which includes metadata
 */
export async function matching({
  labelSelector,
  type,
  inStore,
  $store,
  inScopeCount = undefined,
  namespace = undefined,
  transient = false,
}: {
  /**
   * Standard kube label selector object.
   *
   * If this is 'empty' (no matchLabels or matchExpressions) it will return all results
   */
  labelSelector: KubeLabelSelector,
  /**
   * Resource type
   */
  type: string,
  /**
   * Store in which resources will be cached
   */
  inStore: string,
  /**
   * Standard vuex store object
   */
  $store: any,
  /**
   * Number of resources that are applicable when filtering.
   *
   * Used to skip any potential http request if we know the result will be zero
   *
   * If this property is not supplied we'll try and discover it from the COUNTS resource.
   */
  inScopeCount?: number
  /**
   * Optional namespace or namespaces to apply selector to
   *
   * If this is undefined then namespaces will totally be ignored
   *
   * If this is provided all resources must be within them. If an empty array is provided then no resources will be matched
   *
   */
  namespace?: string | string[],
  /**
   * Should the result bypass the store?
   */
  transient?: boolean,
}): Promise<{
  matched: number,
  matches: any[],
  none: boolean,
  sample: any,
  total: number,
}> {
  let match = [];

  const filterByNamespaces = !!namespace; // Result set must come from a resource in a namespace
  const safeNamespaces = Array.isArray(namespace) ? namespace : !!namespace ? [namespace] : [];

  // Try to determine if there are resources to filter by (nothing to filter on = no matches = skip)
  if (typeof inScopeCount === 'undefined') {
    const counts = $store.getters[`${ inStore }/all`](COUNT)?.[0]?.counts || {};

    if (filterByNamespaces) {
      inScopeCount = 0;
      safeNamespaces.forEach((n) => {
        inScopeCount += counts?.[type]?.namespaces[n]?.count || 0;
      });
    } else {
      inScopeCount = counts?.[type]?.summary?.count || 0;
    }
  }
  const haveCandidates = (inScopeCount || 0) > 0;

  // Try to determine if there are namespaces to filter with (namespaces supplied but empty = no matches = skip
  const ignoredOrHaveNamespaceFilters = (!filterByNamespaces || safeNamespaces.length > 0);

  console.info('selector-type', haveCandidates, ignoredOrHaveNamespaceFilters);

  // Only proceed if there's something to filter on or with
  if (haveCandidates && ignoredOrHaveNamespaceFilters) {
    const haveLabelSelectorFilters = !isLabelSelectorEmpty(labelSelector);

    if ($store.getters[`${ inStore }/paginationEnabled`]?.({ id: type })) {
      console.info('selector-type', 'api', haveLabelSelectorFilters, filterByNamespaces);

      // Pagination for this type is enabled, so apply filters via API
      if (haveLabelSelectorFilters || filterByNamespaces) {
        const findPageArgs: ActionFindPageArgs = {
          pagination: new FilterArgs({
            labelSelector,
            filters: PaginationParamFilter.createMultipleFields(
              safeNamespaces.map(
                (n) => new PaginationFilterField({
                  field: 'metadata.namespace', // API only compatible with steve atm...
                  value: n,
                })
              )
            ),
          }),
          transient,
        };

        match = await $store.dispatch(`${ inStore }/findPage`, { type, opt: findPageArgs });
        if (transient) {
          match = match.data;
        }
      }
    } else {
      // Pagination for this type is NOT enabled, so apply filters locally
      let candidates = [];

      console.info('selector-type', 'local', haveLabelSelectorFilters, filterByNamespaces);

      if (haveLabelSelectorFilters || filterByNamespaces) {
        candidates = await $store.dispatch(`${ inStore }/findAll`, { type });

        // First filter candidates by namespace
        if (filterByNamespaces) {
          console.info('selector-type', 'local', 'ns', safeNamespaces, candidates.length);

          candidates = candidates.filter((e: any) => safeNamespaces.includes(e.metadata?.namespace));
        }

        // Next filter candidates by selector
        if (haveLabelSelectorFilters) {
          console.info('selector-type', 'local', 'label', labelSelector, candidates.length);

          candidates = matches(candidates, labelSelector);
        }
      }

      console.info('selector-type', 'local', 'res', candidates.length);

      match = candidates;
      inScopeCount = candidates.length;
    }
  }

  const matched = match.length || 0;
  const sample = match[0]?.nameDisplay;

  return {
    matched,
    matches: match,
    none:    matched === 0,
    sample,
    total:   inScopeCount || 0,
  };
}

/**
 * This is similar to shell/utils/selector.js `matches`, but accepts a kube labelSelector
 */
function matches<T = any>(candidates: T[], labelSelector: KubeLabelSelector): T[] {
  const convertedObject = convert(labelSelector.matchLabels, labelSelector.matchExpressions);

  return rootMatching(candidates, convertedObject);
}

export function isLabelSelectorEmpty(labelSelector?: KubeLabelSelector): boolean {
  if (labelSelector?.matchExpressions?.length || !isEmpty(labelSelector?.matchLabels)) {
    return false;
  }

  return true;
}
