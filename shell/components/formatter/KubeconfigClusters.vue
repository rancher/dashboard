<script setup lang="ts">
import { computed } from 'vue';

interface ClusterReference {
  label: string;
  location?: object;
}

const MAX_DISPLAY = 25;

const props = defineProps<{
  row: { id: string; sortedReferencedClusters?: ClusterReference[] };
  value?: unknown[];
}>();

const allClusters = computed<ClusterReference[]>(() => {
  return props.row?.sortedReferencedClusters || [];
});

const clusters = computed<ClusterReference[]>(() => {
  return allClusters.value.slice(0, MAX_DISPLAY);
});

const remainingCount = computed<number>(() => {
  return Math.max(0, allClusters.value.length - MAX_DISPLAY);
});
</script>

<template>
  <span class="kubeconfig-clusters">
    <template
      v-for="(cluster, index) in clusters"
    >
      <template v-if="index > 0">,&nbsp;</template>
      <router-link
        v-if="cluster.location"
        :key="`${row.id}-${cluster.label}`"
        :to="cluster.location"
      >
        {{ cluster.label }}
      </router-link>
      <span
        v-else
        :key="`${row.id}-${cluster.label}-deleted`"
        class="text-muted"
      >
        {{ cluster.label }}
      </span>
    </template>
    <span
      v-if="remainingCount > 0"
      class="text-muted"
    >
      {{ t('ext.cattle.io.kubeconfig.moreClusterCount', { remainingCount: remainingCount }) }}
    </span>
    <span
      v-if="allClusters.length === 0"
      class="text-muted"
    >
      &mdash;
    </span>
  </span>
</template>

<style lang="scss" scoped>
.kubeconfig-clusters {
  display: block;
  width: 0;
  min-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
