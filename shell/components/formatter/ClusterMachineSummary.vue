<script setup lang="ts">
import { computed } from 'vue';
import MachineSummaryGraph from '@shell/components/formatter/MachineSummaryGraph.vue';

interface ClusterRow {
  stateParts?: { value: number }[];
  statusInfo?: { nodeCount?: number };
}

const props = defineProps<{ row: ClusterRow }>();

// No machine states means no bar to draw, so a list that hasn't fetched them still shows a count
const hasParts = computed(() => !!props.row?.stateParts?.length);
const nodeCount = computed(() => props.row?.statusInfo?.nodeCount || 0);
</script>

<template>
  <span v-if="!hasParts">{{ nodeCount }}</span>
  <MachineSummaryGraph
    v-else
    :row="row"
  />
</template>
