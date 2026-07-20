import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useStore } from 'vuex';
import { MANAGEMENT } from '@shell/config/types';
import { FilterArgs, PaginationFilterEquality, PaginationParamFilter } from '@shell/types/store/pagination.types';

/**
 * Reads and writes a JSON value to `localStorage`, scoped to a cluster.
 *
 * The storage key is derived reactively as `<clusterId>:<key>`, so switching
 * clusters transparently targets a different entry and an empty cluster id
 * disables access (every method becomes a no-op, so no global key is ever
 * written). All access is wrapped so a full, disabled or otherwise unavailable
 * `localStorage` never throws into the caller.
 *
 * Whenever a value is saved, entries belonging to clusters that no longer exist
 * are pruned, so removed clusters don't leave their data behind.
 *
 * @param key - Prefix that scopes the entry to a feature (e.g. `nav-group-state`).
 * @param clusterId - Cluster to scope to. Accepts a ref or getter so the key
 *                    stays in sync as the active cluster changes. Defaults to
 *                    the currently active cluster from the store.
 * @returns `storageKey` (reactive, `null` when there is no cluster) plus
 *          `load` and `save` helpers.
 */
export function useClusterLocalStorage<T>(
  key: string,
  clusterId?: MaybeRefOrGetter<string>
) {
  const store = useStore();

  const activeClusterId = computed(() => {
    const id = clusterId === undefined ? store.getters.clusterId : toValue(clusterId);

    return id || '';
  });

  const storageKey = computed(() => (activeClusterId.value ? `${ activeClusterId.value }:${ key }` : null));

  /**
   * Returns the parsed value for the current cluster, or `null` when there is
   * no cluster, nothing stored, or the stored value cannot be parsed.
   */
  function load(): T | null {
    if (!storageKey.value) {
      return null;
    }

    try {
      const saved = localStorage.getItem(storageKey.value);

      return saved ? JSON.parse(saved) as T : null;
    } catch (e) {
      console.warn(`Failed to read localStorage key "${ storageKey.value }"`, e); // eslint-disable-line no-console

      return null;
    }
  }

  /**
   * Serializes and stores `value` for the current cluster, then prunes entries
   * for clusters that no longer exist. No-op when there is no cluster or
   * `localStorage` is unavailable.
   */
  function save(value: T): void {
    if (!storageKey.value) {
      return;
    }

    try {
      localStorage.setItem(storageKey.value, JSON.stringify(value));
    } catch (e) {
      // localStorage may be full or unavailable
      console.warn(`Failed to write localStorage key "${ storageKey.value }"`, e); // eslint-disable-line no-console
    }

    pruneStaleClusters();
  }

  /**
   * Every `<clusterId>:<key>` entry in `localStorage`, paired with its cluster id.
   */
  function storedClusterEntries(): { storageKey: string, clusterId: string }[] {
    const suffix = `:${ key }`;
    const entries: { storageKey: string, clusterId: string }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const storedKey = localStorage.key(i);

      if (storedKey?.endsWith(suffix)) {
        entries.push({ storageKey: storedKey, clusterId: storedKey.slice(0, -suffix.length) });
      }
    }

    return entries;
  }

  /**
   * Stale keys when the cluster list is fully loaded: `management/all` is
   * authoritative, so any stored cluster not in it is stale. Returns nothing
   * when the list is empty (store not populated yet), to avoid wiping everything.
   */
  function getStaleKeysLocal(): string[] {
    const clusters = store.getters['management/all'](MANAGEMENT.CLUSTER) || [];

    if (!clusters.length) {
      return [];
    }

    const validIds = new Set<string>(clusters.map((c: { id: string }) => c.id));

    return storedClusterEntries()
      .filter((e) => !validIds.has(e.clusterId))
      .map((e) => e.storageKey);
  }

  /**
   * Stale keys when pagination is on: `management/all` only holds loaded pages,
   * so ask the API which of our stored cluster ids still exist via a
   * server-side `id IN (...)` filter, and treat the rest as stale.
   */
  async function getStaleKeysPaginated(): Promise<string[]> {
    const entries = storedClusterEntries();

    if (!entries.length) {
      return [];
    }

    const res = await store.dispatch('management/findPage', {
      type: MANAGEMENT.CLUSTER,
      opt:  {
        transient:  true,
        pagination: new FilterArgs({
          filters: new PaginationParamFilter({
            fields: [{
              field: 'id', value: entries.map((e) => e.clusterId).join(','), equality: PaginationFilterEquality.IN
            }],
          }),
        }),
      },
    });

    const existingIds = new Set<string>((res?.data || []).map((c: { id: string }) => c.id));

    return entries
      .filter((e) => !existingIds.has(e.clusterId))
      .map((e) => e.storageKey);
  }

  /**
   * Removes `<clusterId>:<key>` entries whose cluster no longer exists, choosing
   * the existence check that matches how clusters are loaded (see the two
   * `getStaleKeys` helpers).
   */
  async function pruneStaleClusters(): Promise<void> {
    try {
      const paginated = store.getters['management/paginationEnabled']?.({
        id:      MANAGEMENT.CLUSTER,
        context: 'side-bar',
      });

      const staleKeys = paginated ? await getStaleKeysPaginated() : getStaleKeysLocal();

      staleKeys.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn(`Failed to prune localStorage entries for "${ key }"`, e); // eslint-disable-line no-console
    }
  }

  return {
    storageKey, load, save
  };
}
