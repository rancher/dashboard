<script setup lang="ts">
import WorkloadNamespaceCard from './WorkloadNamespaceCard.vue';
import type { WorkloadDashboardByNamespaceCard, WorkloadDashboardNamespaceNavigateFn, WorkloadDashboardFilterByNamespaceFn } from './types';

defineProps<{
  cards: WorkloadDashboardByNamespaceCard[];
  navigateToNamespace: WorkloadDashboardNamespaceNavigateFn;
  filterByNamespace: WorkloadDashboardFilterByNamespaceFn;
}>();
</script>

<template>
  <div class="card-grid">
    <WorkloadNamespaceCard
      v-for="card in cards"
      :key="card.title"
      :title="card.title"
      :rows="card.rows"
      :navigate-to-namespace="navigateToNamespace"
      :filter-by-namespace="filterByNamespace"
    />
  </div>
</template>

<style lang="scss" scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}
</style>
