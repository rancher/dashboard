import { COUNT } from '@shell/config/types';
import { KubeLabelSelector } from '@shell/types/kube/kube-api';
import { FilterArgs } from '@shell/types/store/pagination.types';
import { isEmpty } from '@shell/utils/object';
import { matching as rootMatching } from '@shell/utils/selector';

// TODO: RC use this version everywhere

/**
 * Find matching resources either via
 * a) fetching filtered resources directly (if pagination is supported for this type) - findPage
 * b) fetching all of type and filtering locally - findAll --> root matching
 *
 * This is a much smarter version of shell/utils/selector.js `matching` (which just does local filtering)
 *
 * If fetching all of a type can be avoided it's better to use the findLabelSelector action
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
   * Used to skip any potential http request if there's no resources to filter from
   *
   * If this property is not supplied we'll try and fetch it via the COUNTS object.
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
