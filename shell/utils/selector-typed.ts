import { COUNT } from '@shell/config/types';
import { KubeLabelSelector } from '@shell/types/kube/kube-api';
import { FilterArgs } from '@shell/types/store/pagination.types';
import { isEmpty } from '@shell/utils/object';

/**
 * Conditionally make a http request to fetch the results of a labelSelector
 *
 * In order to determine resources that are in scope either supply `inScopeCount`, OR `$store` and `inStore` (this would be nicer in TS)
 *
 * Returns a specific object fit for ??? TODO: RC
 */

// TODO: RC use this version everywhere

export async function findMatchingResources({
  labelSelector,
  type,
  inStore,
  $store,
  inScopeCount = undefined,
  namespace = undefined,
  transient = false,
}: {
  labelSelector: KubeLabelSelector,
  type: string,
  inStore: string,
  $store: any,
  inScopeCount?: number
  namespace?: string,
  transient?: boolean,
}) {
  let match = [];

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

  const matched = match.length || 0;
  const sample = match[0]?.nameDisplay;

  return {
    matched,
    matches: match,
    none:    matched === 0,
    sample,
    total:   inScopeCount,
  };
}
