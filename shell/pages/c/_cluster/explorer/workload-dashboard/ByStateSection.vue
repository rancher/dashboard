<script setup lang="ts">
import { computed } from 'vue';
import WorkloadCard from './WorkloadCard.vue';
import type { WorkloadDashboardByStateLayout, WorkloadDashboardResourceRouteFn } from './types';

const props = defineProps<{
  layout: WorkloadDashboardByStateLayout;
  resourceRoute: WorkloadDashboardResourceRouteFn;
}>();

const gridTemplateRows = computed(() => {
  const unit = props.layout.subHero ? '1fr' : 'auto';

  return `repeat(${ props.layout.gridRows }, ${ unit })`;
});

function gridColumnEnd(rowCount: number, maxSpan: number): string {
  const span = Math.min(rowCount, maxSpan);

  return `${ -(maxSpan - span + 1) }`;
}

function bodyColumns(rowCount: number, maxSpan: number): number | undefined {
  const cols = Math.min(rowCount, maxSpan);

  return cols >= 2 ? cols : undefined;
}

const heroFullGridColumnEnd = computed(() => gridColumnEnd(props.layout.hero?.rows.length ?? 3, 3));
const heroWideGridColumnEnd = computed(() => gridColumnEnd(props.layout.hero?.rows.length ?? 2, 2));
const subHeroGridColumnEnd = computed(() => gridColumnEnd(props.layout.subHero?.rows.length ?? 1, 2));

const heroBodyColumns = computed(() => {
  if (props.layout.heroMode === 'full') {
    return bodyColumns(props.layout.hero?.rows.length ?? 0, 3);
  }
  if (props.layout.heroMode === 'wide') {
    return bodyColumns(props.layout.hero?.rows.length ?? 0, 2);
  }

  return undefined;
});

const subHeroBodyColumns = computed(() => bodyColumns(props.layout.subHero?.rows.length ?? 0, 2));

function toCardRows(rows: typeof props.layout.cards[0]['rows']) {
  return rows.map((row) => ({
    label:  row.label,
    to:     props.resourceRoute(row.type, row.stateNames),
    color:  row.color,
    counts: row.counts,
  }));
}
</script>

<template>
  <div
    class="bento-grid"
    :class="{ 'bento-grid--has-sub-hero': !!layout.subHero }"
  >
    <WorkloadCard
      v-for="card in layout.cards"
      :key="card.color"
      class="state-card"
      data-testid="workload-dashboard-state-card"
      :class="'state-card--' + card.color"
      :rows="toCardRows(card.rows)"
      :aria-label="card.color + ' workloads'"
    />
    <WorkloadCard
      v-if="layout.subHero"
      class="state-card bento-sub-hero"
      data-testid="workload-dashboard-state-card"
      :class="'state-card--' + layout.subHero.color"
      :body-columns="subHeroBodyColumns"
      :rows="toCardRows(layout.subHero.rows)"
      :aria-label="layout.subHero.color + ' workloads'"
    />
    <WorkloadCard
      v-if="layout.hero"
      class="state-card bento-hero"
      data-testid="workload-dashboard-state-card"
      :class="['state-card--' + layout.hero.color, 'bento-hero--' + layout.heroMode]"
      :body-columns="heroBodyColumns"
      :rows="toCardRows(layout.hero.rows)"
      :aria-label="layout.hero.color + ' workloads'"
    />
  </div>
</template>

<style lang="scss" scoped>
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: v-bind(gridTemplateRows);
  grid-auto-flow: dense;
  gap: 15px;

  .bento-hero {
    grid-column: 3;
    grid-row: 1 / -1;

    &--full {
      grid-column: 1 / v-bind(heroFullGridColumnEnd);
    }

    &--wide {
      grid-column: 2 / v-bind(heroWideGridColumnEnd);
    }
  }

  .bento-sub-hero {
    grid-column: 2 / v-bind(subHeroGridColumnEnd);
    grid-row: 1 / -1;
  }

  &.bento-grid--has-sub-hero {
    .state-card:not(.bento-hero):not(.bento-sub-hero) {
      grid-column: 1;
    }
  }

  .state-card {
    border: 0;

    @each $color in (error, warning, info, success, disabled) {
      &--#{$color} {
        background: var(--#{$color}-banner-bg, rgba(var(--#{$color}-rgb), 0.1));
      }
    }
  }
}
</style>
