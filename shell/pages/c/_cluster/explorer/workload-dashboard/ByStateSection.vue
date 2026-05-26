<script setup lang="ts">
import { computed } from 'vue';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import ResourceRow from '@shell/components/Resource/Detail/ResourceRow.vue';
import type { WorkloadDashboardByStateLayout, WorkloadDashboardResourceRouteFn } from './types';

const props = defineProps<{
  layout: WorkloadDashboardByStateLayout;
  resourceRoute: WorkloadDashboardResourceRouteFn;
}>();

const gridTemplateRows = computed(() => {
  const unit = props.layout.subHero ? '1fr' : 'auto';

  return `repeat(${ props.layout.gridRows }, ${ unit })`;
});
</script>

<template>
  <div
    class="bento-grid"
    :class="{ 'bento-grid--has-sub-hero': !!layout.subHero }"
  >
    <Card
      v-for="card in layout.cards"
      :key="card.color"
      class="state-card"
      data-testid="workload-dashboard-state-card"
      :class="'state-card--' + card.color"
    >
      <ResourceRow
        v-for="(row, idx) in card.rows"
        :key="idx"
        :label="row.label"
        :to="resourceRoute(row.type, row.stateNames)"
        :color="row.color"
        :counts="row.counts"
        compact
      />
    </Card>
    <Card
      v-if="layout.subHero"
      class="state-card bento-sub-hero"
      :class="'state-card--' + layout.subHero.color"
    >
      <ResourceRow
        v-for="(row, idx) in layout.subHero.rows"
        :key="idx"
        :label="row.label"
        :to="resourceRoute(row.type, row.stateNames)"
        :color="row.color"
        :counts="row.counts"
        compact
      />
    </Card>
    <Card
      v-if="layout.hero"
      class="state-card bento-hero"
      :class="['state-card--' + layout.hero.color, 'bento-hero--' + layout.heroMode]"
      :body-columns="layout.heroMode === 'full' ? 3 : layout.heroMode === 'wide' ? 2 : undefined"
    >
      <ResourceRow
        v-for="(row, idx) in layout.hero.rows"
        :key="idx"
        :label="row.label"
        :to="resourceRoute(row.type, row.stateNames)"
        :color="row.color"
        :counts="row.counts"
        compact
      />
    </Card>
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
      grid-column: 1 / -1;
    }

    &--wide {
      grid-column: 2 / -1;
    }
  }

  .bento-sub-hero {
    grid-column: 2;
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
