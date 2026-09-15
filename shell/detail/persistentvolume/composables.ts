import { computed, ref, Ref } from 'vue';
import { useStore } from 'vuex';
import { NAMESPACE as NAMESPACE_COL } from '@shell/config/table-headers';
import { PVC } from '@shell/config/types';

/**
 * Remove the namespace column from a set of table headers.
 *
 * The related resources shown on these detail pages always share the parent's namespace, so the
 * column would repeat the same value on every row.
 */
export const withoutNamespaceColumn = (headers: any[]): any[] => headers.filter((h) => !h.name || h.name !== NAMESPACE_COL.name);

/**
 * Fetch and expose the PersistentVolumeClaim bound to a PersistentVolume, along with the schema and
 * table headers used to render it.
 */
export const useBoundPersistentVolumeClaim = (pv: any) => {
  const store = useStore();

  const pvcSchema = computed(() => store.getters['cluster/schemaFor'](PVC));
  const pvcHeaders = computed(() => (pvcSchema.value ? withoutNamespaceColumn(store.getters['type-map/headersFor'](pvcSchema.value)) : []));
  const claims: Ref<any[]> = ref([]);

  if (pvcSchema.value) {
    pv.fetchPersistentVolumeClaim().then((claim: any) => {
      claims.value = claim ? [claim] : [];
    });
  }

  return {
    pvcSchema,
    pvcHeaders,
    claims,
  };
};
