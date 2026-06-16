import { reactive } from 'vue';
import { useStore } from 'vuex';
import { colorForState } from '@shell/plugins/dashboard-store/resource-class';
import type { StateColor } from '@shell/utils/style';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';

export interface StateSummaryEntry {
  type: string;
  summary: { property: string; counts: Record<string, { total: number; namespace: Record<string, number> }> }[] | null;
}

const stateColorCache = reactive<Record<string, StateColor>>({});
const pendingResolves = new Set<string>();

/**
 * Composable that maps Kubernetes resource state names to dashboard color tokens.
 *
 * This scenario is to forcefully resolve state colors based on properties like error and transitioning.
 * It is to be used when you only have the state name and don't have the actual state object
 *
 * Using a request of only one resource per unknown state, it will fetch the data to retrieve the state object.
 * For normal cases where the object is already available, this composable is not needed.
 *
 * @returns `toStateColor` — synchronous lookup that triggers background API
 *          resolution for unknown states when a resource type is provided.
 */
export function useStateColor() {
  const store = useStore();

  /**
   * Returns the cached {@link StateColor} for a given state name.
   * Falls back to `colorForState` as a temporary color and triggers an async
   * resolve via the Steve API when `type` is provided. Once resolved, the
   * reactive cache updates and the UI re-renders with the correct color.
   *
   * @param state - The resource state name (e.g. `'active'`, `'error'`). Case-insensitive.
   * @param type - The Steve resource type (e.g. `'apps.deployment'`). Used to
   *               fetch a resource via the API when the state is not cached.
   * @returns The resolved color token.
   */
  function toStateColor(state: string, type: string): StateColor {
    const stateLower = (state || '').toLowerCase();
    const key = `${ type }:${ stateLower }`;

    if (stateColorCache[key]) {
      return stateColorCache[key];
    }

    if (!pendingResolves.has(key)) {
      pendingResolves.add(key);
      resolveStateColor(key, state, type);
    }

    const rawColor = colorForState(stateLower, false, false).replace('text-', '');

    return (rawColor === 'darker' ? 'disabled' : rawColor) as StateColor;
  }

  async function resolveStateColor(key: string, originalName: string, type: string): Promise<void> {
    try {
      const schema = store.getters['cluster/schemaFor'](type);
      const params = stevePaginationUtils.createParamsForPagination({
        schema,
        opt: {
          pagination: {
            page:                 1,
            pageSize:             1,
            sort:                 [],
            filters:              [PaginationParamFilter.createSingleField({ field: 'metadata.state.name', value: originalName })],
            projectsOrNamespaces: [],
          }
        }
      });
      const url = `${ store.getters['cluster/urlFor'](type) }?${ params }`;
      const res = await store.dispatch('cluster/request', { url });
      const resource = res?.data?.[0];

      if (resource?.metadata?.state) {
        const { error: isError, transitioning, name } = resource.metadata.state;
        const rawColor = colorForState(name, isError, transitioning).replace('text-', '');

        stateColorCache[key] = (rawColor === 'darker' ? 'disabled' : rawColor) as StateColor;
      }
    } catch {
      // Keep the colorForState fallback
    } finally {
      pendingResolves.delete(key);
    }
  }

  async function resolveStateColors(entries: StateSummaryEntry[]): Promise<void> {
    const toResolve: Array<{ key: string; originalName: string; type: string }> = [];

    for (const entry of entries) {
      if (!entry.summary) {
        continue;
      }

      for (const s of entry.summary) {
        if (s.property === 'metadata.state.name') {
          for (const stateName of Object.keys(s.counts)) {
            const key = stateName.toLowerCase();

            const cacheKey = `${ entry.type }:${ key }`;

            if (!stateColorCache[cacheKey] && !pendingResolves.has(cacheKey)) {
              pendingResolves.add(cacheKey);
              toResolve.push({
                key: cacheKey, originalName: stateName, type: entry.type
              });
            }
          }
        }
      }
    }

    const concurrency = 10;

    for (let i = 0; i < toResolve.length; i += concurrency) {
      await Promise.all(
        toResolve.slice(i, i + concurrency).map((r) => resolveStateColor(r.key, r.originalName, r.type))
      );
    }
  }

  return { toStateColor, resolveStateColors };
}
