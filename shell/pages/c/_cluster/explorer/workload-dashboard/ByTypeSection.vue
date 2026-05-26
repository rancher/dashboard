<script setup lang="ts">
import StatusCard from '@shell/components/Resource/Detail/Card/StatusCard/index.vue';
import type { WorkloadDashboardByTypeCard, WorkloadDashboardResourceRouteFn } from './types';

defineProps<{
  cards: WorkloadDashboardByTypeCard[];
  resourceRoute: WorkloadDashboardResourceRouteFn;
}>();
</script>

<template>
  <div class="card-grid">
    <StatusCard
      v-for="card in cards"
      :key="card.title"
      :title="card.title"
      :to="resourceRoute(card.type)"
      :row-to="resourceRoute(card.type)"
      :resources="card.resources"
      :show-percent="false"
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
