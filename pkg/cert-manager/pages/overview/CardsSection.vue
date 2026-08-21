<script setup lang="ts">
import OverviewCard from './OverviewCard.vue';
import type { OverviewStatusCard } from './types';

/** A titled grid of status cards, shared by the Issuers and ACME sections. */
defineProps<{
  title: string;
  cards: OverviewStatusCard[];
  testid?: string;
}>();
</script>

<template>
  <div
    class="section"
    :data-testid="testid"
  >
    <h4 class="mm-0 text-deemphasized">
      {{ title }}
    </h4>
    <div class="card-grid">
      <OverviewCard
        v-for="card in cards"
        :key="card.key"
        :card="card"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);

  h4 {
    line-height: 21px;
  }
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}
</style>
