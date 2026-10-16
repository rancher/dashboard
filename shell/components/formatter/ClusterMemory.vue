<script setup lang="ts">
import { computed } from 'vue';
import { createMemoryFormat, formatSi, parseSi } from '@shell/utils/units';

interface ClusterRow {
  mgmt?: ClusterRow;
  status?: { allocatable?: { memory?: string } };
}

const props = defineProps<{ row: ClusterRow }>();

const cluster = computed(() => props.row?.mgmt || props.row);

const allocatable = computed(() => {
  const parsed = (parseSi(cluster.value?.status?.allocatable?.memory) || 0).toString();

  return formatSi(parsed, createMemoryFormat(parsed));
});

// "0 GiB" means nothing was reported
const hasMemory = computed(() => !!allocatable.value && !allocatable.value.match(/^0 [a-zA-Z]/));
</script>

<template>
  <span v-if="hasMemory">{{ allocatable }}</span>
  <span v-else>&mdash;</span>
</template>
