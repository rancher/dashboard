<script setup lang="ts">
import { computed } from 'vue';
import MachineSummaryGraph from '@shell/components/formatter/MachineSummaryGraph.vue';

interface ClusterRow {
  stateParts?: { value: number }[];
  statusInfo?: { nodeCount?: number };
}

const props = defineProps<{ row: ClusterRow }>();

// Machine states are fetched separately, so a list without them shows a count
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
