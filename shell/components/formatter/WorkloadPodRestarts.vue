<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { useFetch } from '@shell/components/Resource/Detail/FetchLoader/composables';

/**
 * Shows how many times the pods of a workload have restarted, adding up the RESTARTS column of `kubectl get pods`.
 *
 * Pods the store already has, e.g. when a popover shows a ReplicaSet on the page of its Deployment, are used as they
 * are and kept up to date over the websocket. Otherwise they're fetched when this is shown, e.g. on the page of a pod,
 * which only has that pod. Avoid it in lists, where every row could fetch its pods
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

const storePods = computed(() => props.row.podsInStore);

const fetch = useFetch(async() => {
  if (storePods.value) {
    return undefined;
  }

  return (await (props.row.fetchGlancePods ? props.row.fetchGlancePods() : props.row.matchingPods())) || [];
});

const pods = computed(() => storePods.value || fetch.value.data);

const restarts = computed(() => pods.value?.reduce((total: number, pod: any) => total + (pod.totalRestartCount || 0), 0));
</script>

<template>
  <i
    v-if="!pods && fetch.loading"
    class="icon icon-spinner icon-spin"
    role="status"
    :aria-label="i18n.t('component.resource.detail.glance.ariaLabel.loading')"
  />
  <span v-else-if="restarts === undefined">—</span>
  <span v-else>{{ restarts }}</span>
</template>
