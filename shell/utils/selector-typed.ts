import { COUNT } from '@shell/config/types';
import { KubeLabelSelector, KubeLabelSelectorExpression } from '@shell/types/kube/kube-api';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';
import { FilterArgs, PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';
import { isEmpty } from '@shell/utils/object';
import { convert, matching as rootMatching } from '@shell/utils/selector';

type MatchingResponse = {
  matched: number,
  matches: any[],
  none: boolean,
  sample: any,
  total: number,
}

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
  transient = true,
}: {
  /**
   * Standard kube label selector object.
   *
   * If this is 'empty' (no matchLabels or matchExpressions) it will return all results
   *
   * If this is 'null' it will return no results
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
}): Promise<MatchingResponse> {
  const isNamespaced = $store.getters[`${ inStore }/schemaFor`](type)?.attributes.namespaced;
  const safeNamespaces = Array.isArray(namespace) ? namespace : !!namespace ? [namespace] : [];
  const filterByNamespaces = isNamespaced && !!namespace ; // Result set must come from a resource in a namespace

  // Determine if there's actually anything to filter on
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

  // Exit early if there are any situations that always return nothing
  const noCandidates = (inScopeCount || 0) === 0;
  const filterByNamespaceButNoNamespace = isNamespaced && !!namespace && (!safeNamespaces || safeNamespaces.length === 0);
  const explicityNullLabelSelector = labelSelector === null || (labelSelector?.matchLabels === null && !labelSelector.matchExpressions === null);

  // If we have matchLabels or matchExpression entries they must have a key
  const matchLabelKeys = Object.keys(labelSelector.matchLabels || {});
  const invalidMatchLabelKeys = matchLabelKeys.length && matchLabelKeys.filter((k) => !k).length;
  const invalidMatchExpressionKeys = labelSelector?.matchExpressions?.length && labelSelector.matchExpressions.filter((me) => !me.key).length;

  if (noCandidates || filterByNamespaceButNoNamespace || explicityNullLabelSelector || invalidMatchLabelKeys || invalidMatchExpressionKeys) {
    return generateMatchingResponse([], inScopeCount || 0);
  }

  if ($store.getters[`${ inStore }/paginationEnabled`]?.({ id: type })) {
    if (isLabelSelectorEmpty(labelSelector) && (!!namespace && !safeNamespaces?.length)) {
      // no namespaces - ALL resources are candidates
      // no labels - return all candidates
      // too many to fetch...
      throw new Error('Either populated labelSelector or namespace/s must be supplied in order to call findPage');
    }

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

    let match = await $store.dispatch(`${ inStore }/findPage`, { type, opt: findPageArgs });

    if (transient) {
      match = match.data;
    }

    return generateMatchingResponse(match, inScopeCount || 0);
  } else {
    // Start off with everything as a candidate
    let candidates = await $store.dispatch(`${ inStore }/findAll`, { type });

    inScopeCount = candidates.length;

    // Filter out namespace specific stuff
    if (isNamespaced && safeNamespaces?.length > 0) {
      candidates = candidates.filter((e: any) => safeNamespaces.includes(e.metadata?.namespace));
      inScopeCount = candidates.length;
    }

    // Apply labelSelector
    if (labelSelector.matchLabels || labelSelector.matchExpressions) {
      candidates = matches(candidates, labelSelector, 'metadata.labels');
    }

    return generateMatchingResponse(candidates, inScopeCount || 0);
  }
}

const generateMatchingResponse = <T extends { [key: string]: any, nameDisplay: string}>(match: T[], inScopeCount: number): MatchingResponse => {
  const matched = match.length || 0;
  const sample = match[0]?.nameDisplay;

  return {
    matched,
    matches: match,
    none:    matched === 0,
    sample,
    total:   inScopeCount || 0,
  };
};

/**
 * This is similar to shell/utils/selector.js `matches`, but accepts a kube labelSelector
 */
function matches<T = any>(candidates: T[], labelSelector: KubeLabelSelector, labelKey: string): T[] {
  const convertedObject = convert(labelSelector.matchLabels, labelSelector.matchExpressions);

  return rootMatching(candidates, convertedObject, labelKey);
}

export function isLabelSelectorEmpty(labelSelector?: KubeLabelSelector): boolean {
  return !labelSelector?.matchExpressions?.length && isEmpty(labelSelector?.matchLabels);
}

export function labelSelectorToSelector(labelSelector?: KubeLabelSelector): string {
  if (isLabelSelectorEmpty(labelSelector)) {
    return '';
  }

  const res: string[] = [];

  Object.entries(labelSelector?.matchLabels || {}).forEach(([key, value]) => {
    res.push(`${ key }=${ value }`);
  });

  (labelSelector?.matchExpressions || []).forEach((value: KubeLabelSelectorExpression) => {
    if (value.operator === 'In' && value.values !== undefined) {
      if (value.values?.length === 1) {
        res.push(`${ value.key }=${ value.values[0] }`);
      } else {
        res.push(`${ value.key } in (${ value.values.join(',') })`);
      }
    } else {
      throw new Error(`Unsupported matchExpression found when converting to selector string. ${ value }`);
    }
  });

  return res.join(',');
}
