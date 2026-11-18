import { onMounted, ref, Ref } from 'vue';
import { useStore } from 'vuex';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';

/**
 * Load the resource types a detail page links to.
 *
 * The model getters that assemble related resources read `cluster/all`, which only returns what
 * has already been fetched - a detail page reached directly loads just its own resource, so those
 * getters come back empty. This fires the loads (`checkSchemasForFindAllHash` skips anything the
 * user cannot read) and flips `loaded` once they settle.
 *
 * Callers gate the related-data parts of their template on `loaded`: the load is asynchronous, so
 * relying on store reactivity alone can leave the first render reading an empty store with nothing
 * to trigger a recompute. Waiting for `loaded` guarantees the getters run against the populated
 * store, matching how the overview page gates its content.
 */
export function useRelatedTypes(types: string[]): { loaded: Ref<boolean> } {
  const store = useStore();
  const loaded = ref(false);

  onMounted(async() => {
    try {
      const hash = types.reduce((acc: Record<string, any>, type) => {
        acc[type] = { inStoreType: 'cluster', type };

        return acc;
      }, {});

      await checkSchemasForFindAllHash(hash, store);
    } finally {
      loaded.value = true;
    }
  });

  return { loaded };
}
