import { computed, ref, Ref } from 'vue';
import { useStore } from 'vuex';
import { NAMESPACE as NAMESPACE_COL } from '@shell/config/table-headers';
import { POD } from '@shell/config/types';

/**
 * Remove the namespace column from a set of table headers.
 *
 * The Pods shown here always share the claim's namespace, so the column would repeat the same value
 * on every row.
 */
export const withoutNamespaceColumn = (headers: any[]): any[] => headers.filter((h) => !h.name || h.name !== NAMESPACE_COL.name);

/**
 * Fetch and expose the Pods that mount a PersistentVolumeClaim, along with the schema and table
 * headers used to render them.
 */
export const useMountedPods = (pvc: any) => {
  const store = useStore();

  const podSchema = computed(() => store.getters['cluster/schemaFor'](POD));
  const podHeaders = computed(() => (podSchema.value ? withoutNamespaceColumn(store.getters['type-map/headersFor'](podSchema.value)) : []));
  const mountedPods: Ref<any[]> = ref([]);

  if (podSchema.value) {
    pvc.fetchMountedPods().then((pods: any[]) => {
      mountedPods.value = pods;
    });
  }

  return {
    podSchema,
    podHeaders,
    mountedPods,
  };
};
