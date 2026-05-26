import { reactive } from 'vue';
import { useStore } from 'vuex';
import { STATES, colorForState } from '@shell/plugins/dashboard-store/resource-class';
import type { StateColor } from '@shell/utils/style';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';

export interface StateSummaryEntry {
  type: string;
  summary: { property: string; counts: Record<string, number> }[] | null;
}

const stateColorCache = reactive<Record<string, StateColor>>({});

export function useStateColor() {
  const store = useStore();

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
          const url = `${ schema.links.collection }?${ params }`;
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
