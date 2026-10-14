import type { RouteLocationRaw } from 'vue-router';
import { STATE_FILTER_QUERY } from '@shell/config/query-params';
import type { StateSummaryEntry } from '@shell/composables/useStateColor';

/**
 * Route to the list of a resource type in the cluster explorer, opened filtered to the given states
 */
export function resourceListRoute(clusterId: string, type: string, stateNames?: string[]): RouteLocationRaw {
  const loc: { name: string; params: Record<string, string>; query?: Record<string, string> } = {
    name:   'c-cluster-product-resource',
    params: {
      cluster:  clusterId,
      product:  'explorer',
      resource: type,
    },
  };

  if (stateNames?.length) {
    // The list opens filtered to these, in its query
    loc.query = { [STATE_FILTER_QUERY]: stateNames.join(',') };
  }

  return loc;
}

/**
 * Validates the shape of a successfully fetched steve summary response.
 * - An empty/absent summary is only valid when there is also no `data`
 *   (a populated `data` with no summary means we got the wrong response).
 * - When a summary is present, every state entry under `counts` must
 *   include a `total`; a count key without `total` is invalid.
 */
export function isValidSummaryResponse(res: { summary?: StateSummaryEntry['summary']; data?: unknown }): boolean {
  const summary = res?.summary;

  if (!Array.isArray(summary) || summary.length === 0) {
    // With no summary, the response is only valid when there is also no data.
    return Array.isArray(res?.data) ? res.data.length === 0 : !res?.data;
  }

  return summary.every((item) => Object.values(item.counts || {})
    .every((detail) => typeof detail?.total === 'number'));
}
