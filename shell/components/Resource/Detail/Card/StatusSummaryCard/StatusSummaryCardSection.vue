<script setup lang="ts" generic="T extends StatusSummaryCardItem">
import StatusSummaryCard from '@shell/components/Resource/Detail/Card/StatusSummaryCard/index.vue';
import type { StatusSummaryCardItem } from './types';

/**
 * A grid of status summary cards with an optional title above it. The `empty` slot is forwarded to
 * every card that has no rows, along with the card itself, so consumers can render a message that
 * depends on the card (e.g. a per-type create link).
 */
withDefaults(defineProps<{
  cards: T[];
  title?: string;
  columns?: number;
}>(), {
  title:   undefined,
  columns: 3,
});

defineSlots<{ empty?:(props: { card: T }) => unknown }>();
</script>

<template>
  <div class="status-summary-card-section">
    <h4
      v-if="title"
      class="mm-0 text-deemphasized"
    >
      {{ title }}
    </h4>
    <div
      class="card-grid"
      :style="{ gridTemplateColumns: `repeat(${ columns }, 1fr)` }"
    >
      <StatusSummaryCard
        v-for="card in cards"
        :key="card.key"
        :title="card.title"
        :total="card.total"
        :segments="card.segments"
        :rows="card.rows"
        :to="card.to"
      >
        <template
          v-if="$slots.empty"
          #empty
        >
          <slot
            name="empty"
            :card="card"
          />
        </template>
      </StatusSummaryCard>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.status-summary-card-section {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);

  h4 {
    line-height: 21px;
  }
}

.card-grid {
  display: grid;
  gap: var(--gap-md);
}
</style>
