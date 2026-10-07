<script setup lang="ts">
import StatusBreakdownCard from '@shell/components/Resource/Detail/Card/StatusBreakdownCard/index.vue';
import type { StatusBreakdownCardItem } from '@shell/components/Resource/Detail/Card/StatusBreakdownCard/types';
import type { WorkloadDashboardFilterByNamespaceFn } from './types';

defineProps<{
  cards: StatusBreakdownCardItem[];
  filterByNamespace: WorkloadDashboardFilterByNamespaceFn;
}>();
</script>

<template>
  <div class="card-grid">
    <!-- Card links go to the workload lists. Each click also sets the namespace filter to the card's namespace -->
    <StatusBreakdownCard
      v-for="card in cards"
      :key="card.key"
      :title="card.title"
      :rows="card.rows"
      :selectable="card.selectable"
      data-testid="workload-dashboard-namespace-card"
      @select="filterByNamespace(card.title)"
      @select-row="filterByNamespace(card.title)"
      @select-count="filterByNamespace(card.title)"
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
