import { onMounted } from 'vue';
import { useStore } from 'vuex';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';

/**
 * Load the resource types a detail page links to.
 *
 * The model getters that assemble related resources read `cluster/all`, which only returns what
 * has already been fetched - a detail page reached directly loads just its own resource, so those
 * getters come back empty. The store is reactive, so this fires the loads and lets the getters
 * fill in; `checkSchemasForFindAllHash` skips anything the user cannot read.
 */
export function useRelatedTypes(types: string[]) {
  const store = useStore();

  onMounted(() => {
    const hash = types.reduce((acc: Record<string, any>, type) => {
      acc[type] = { inStoreType: 'cluster', type };

      return acc;
    }, {});

    checkSchemasForFindAllHash(hash, store);
  });
}
