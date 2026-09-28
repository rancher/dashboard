<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { useFetch } from '@shell/components/Resource/Detail/FetchLoader/composables';

/**
 * Shows how many times the pods of a workload have restarted, adding up the RESTARTS column of `kubectl get pods`.
 *
 * The pods are fetched when this is shown, because they often aren't in the store, e.g. when a popover shows a ReplicaSet
 * on the page of its Deployment. Avoid it in lists, where every row would fetch its pods
 */
export interface Props {
  /**
   * The workload
   */
  row: any;
}

const props = defineProps<Props>();
const store = useStore();
const i18n = useI18n(store);
const fetch = useFetch(async() => (await props.row.matchingPods()) || []);

const restarts = computed(() => fetch.value.data?.reduce((total: number, pod: any) => total + (pod.totalRestartCount || 0), 0));
</script>

<template>
  <i
    v-if="fetch.loading"
    class="icon icon-spinner icon-spin"
    role="status"
    :aria-label="i18n.t('component.resource.detail.glance.ariaLabel.loading')"
  />
  <span v-else-if="restarts === undefined">—</span>
  <span v-else>{{ restarts }}</span>
</template>
