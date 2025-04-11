import { COUNT } from '@shell/config/types';
import { KubeLabelSelector } from '@shell/types/kube/kube-api';
import { FilterArgs } from '@shell/types/store/pagination.types';
import { isEmpty } from '@shell/utils/object';
import { matching as rootMatching } from '@shell/utils/selector';

// TODO: RC investigate where this < `findLabelSelector` could be used

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
   * Standard kube label selector object
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
   * Optional namespace to apply selector to
   */
  namespace?: string,
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
  // TODO: RC confirm value of selector from everywhere (matches has some funky logic aka converts odd things, if valid returns all candidates)
  let match = [];

  if ($store.getters[`${ inStore }/paginationEnabled`]?.({ id: type })) {
    if (labelSelector?.matchExpressions?.length || !isEmpty(labelSelector?.matchLabels)) {
      if (typeof inScopeCount === 'undefined') {
        const counts = $store.getters[`${ inStore }/all`](COUNT)?.[0]?.counts || {};

        inScopeCount = namespace ? counts?.[type]?.namespaces[namespace]?.count || 0 : counts?.[type]?.summary?.count || 0;
      }

      if (inScopeCount) {
        const findPageArgs = { // Of type ActionFindPageArgs
          namespaced: namespace,
          pagination: new FilterArgs({ labelSelector }),
          transient,
        };

        match = await $store.dispatch(`${ inStore }/findPage`, { type, opt: findPageArgs });
      }
    }
  } else {
    let candidates = await $store.dispatch(`${ inStore }/findAll`, { type });

    if (namespace) {
      candidates = candidates.filter((e: any) => e.metadata?.namespace === namespace);
    }

    match = rootMatching(candidates, labelSelector);
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
