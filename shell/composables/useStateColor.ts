import { reactive } from 'vue';
import { useStore } from 'vuex';
import { STATES, colorForState } from '@shell/plugins/dashboard-store/resource-class';
import type { StateColor } from '@shell/utils/style';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';

/**
 * A resource type paired with its summary data from the Resource Summary API.
 */
export interface StateSummaryEntry {
  /** The Steve resource type identifier (e.g. `apps.deployment`). */
  type: string;
  /** Summary buckets returned by the API, or `null` if unavailable. */
  summary: { property: string; counts: Record<string, number> }[] | null;
}

const stateColorCache = reactive<Record<string, StateColor>>({});

/**
 * Composable that maps Kubernetes resource state names to dashboard color tokens.
 *
 * This scenario is to forcefully resolve state colors based on properties like error and transitioning.
 * It is to be used when you only have the state name and don't have the actual state object
 *
 * Using a request of only one resource per unknown state, it will fetch the data to retrieve the state object.
 * For normal cases where the object is already available, this composable is not needed.
 *
 * @returns `toStateColor` for synchronous lookups and `resolveStateColors` for
 *          batch-resolving unknown states via the Steve API.
 */
export function useStateColor() {
  const store = useStore();

  /**
   * Returns the cached {@link StateColor} for a given state name.
   * Falls back to the static `STATES` map and defaults to `'info'` if the state is unknown.
   *
   * @param state - The resource state name (e.g. `'active'`, `'error'`). Case-insensitive.
   * @returns The resolved color token.
   */
  function toStateColor(state: string): StateColor {
    const key = (state || '').toLowerCase();

    if (stateColorCache[key]) {
      return stateColorCache[key];
    }

    const config = STATES[key];
    const color = config?.color || 'info';
    const resolved = (color === 'darker' ? 'disabled' : color) as StateColor;

    stateColorCache[key] = resolved;

    return resolved;
  }

  /**
   * Batch-resolves state colors that are not yet in the cache by fetching a
   * single resource per unknown state from the Steve API and deriving the color
   * from its `metadata.state`. Fetches run in parallel with a concurrency limit of 10.
   *
   * @param entries - Resource summary entries whose state names should be resolved.
   */
  async function resolveStateColors(entries: StateSummaryEntry[]): Promise<void> {
    const unresolvedStates = new Map<string, { originalName: string; type: string }>();

    for (const entry of entries) {
      if (!entry.summary) {
        continue;
      }

      for (const s of entry.summary) {
        if (s.property === 'metadata.state.name') {
          for (const stateName of Object.keys(s.counts)) {
            const key = stateName.toLowerCase();

            if (!stateColorCache[key] && !unresolvedStates.has(key)) {
              unresolvedStates.set(key, { originalName: stateName, type: entry.type });
            }
          }
        }
      }
    }

    if (unresolvedStates.size === 0) {
      return;
    }

    const newColors: Record<string, StateColor> = {};
    const pending = Array.from(unresolvedStates.entries());
    const concurrency = 10;

    for (let i = 0; i < pending.length; i += concurrency) {
      const batch = pending.slice(i, i + concurrency);

      await Promise.all(batch.map(async([stateKey, { originalName, type }]) => {
        try {
          const schema = store.getters['cluster/schemaFor'](type);
          // It requests only one resource since we only need the state object to determine the color
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

          if (!resource?.metadata?.state) {
            return;
          }

          const { error: isError, transitioning, name } = resource.metadata.state;
          const rawColor = colorForState(name, isError, transitioning).replace('text-', '');

          newColors[stateKey] = (rawColor === 'darker' ? 'disabled' : rawColor) as StateColor;
        } catch {
          // Fallback handled by toStateColor via STATES lookup
        }
      }));
    }

    if (Object.keys(newColors).length > 0) {
      Object.assign(stateColorCache, newColors);
    }
  }

  return {
    toStateColor,
    resolveStateColors,
  };
}
