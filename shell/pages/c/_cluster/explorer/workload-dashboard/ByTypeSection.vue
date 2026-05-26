<script setup lang="ts">
import WorkloadTypeCard from './WorkloadTypeCard.vue';
import type { WorkloadDashboardByTypeCard, WorkloadDashboardResourceRouteFn } from './types';

defineProps<{
  cards: WorkloadDashboardByTypeCard[];
  resourceRoute: WorkloadDashboardResourceRouteFn;
}>();
</script>

<template>
  <div class="card-grid">
    <WorkloadTypeCard
      v-for="card in cards"
      :key="card.title"
      :title="card.title"
      :to="resourceRoute(card.type)"
      :resources="card.resources"
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
