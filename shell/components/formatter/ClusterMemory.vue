<script setup lang="ts">
import { computed } from 'vue';
import { createMemoryFormat, formatSi, parseSi } from '@shell/utils/units';

interface ClusterRow {
  mgmt?: ClusterRow;
  status?: { allocatable?: { memory?: string } };
}

const props = defineProps<{ row: ClusterRow }>();

// A provisioning cluster carries the numbers on its management cluster; a management one is it
const cluster = computed(() => props.row?.mgmt || props.row);

const allocatable = computed(() => {
  const parsed = (parseSi(cluster.value?.status?.allocatable?.memory) || 0).toString();

  return formatSi(parsed, createMemoryFormat(parsed));
});

// "0 GiB" and friends mean nothing was reported rather than a cluster with no memory
const hasMemory = computed(() => !!allocatable.value && !allocatable.value.match(/^0 [a-zA-Z]/));
</script>

<template>
  <span v-if="hasMemory">{{ allocatable }}</span>
  <span v-else>&mdash;</span>
</template>
