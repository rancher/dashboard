<script setup lang="ts">
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import ResourceRow from '@shell/components/Resource/Detail/ResourceRow.vue';
import type { ByStateLayout, ResourceRouteFn } from './types';

defineProps<{
  layout: ByStateLayout;
  resourceRoute: ResourceRouteFn;
}>();
</script>

<template>
  <div
    class="bento-grid"
    :class="{ 'bento-grid--has-sub-hero': !!layout.subHero }"
    :style="{ 'grid-template-rows': 'repeat(' + layout.gridRows + ', ' + (layout.subHero ? '1fr' : 'auto') + ')' }"
  >
    <Card
      v-for="card in layout.cards"
      :key="card.color"
      class="state-card"
      :class="'state-card--' + card.color"
    >
      <ResourceRow
        v-for="(row, idx) in card.rows"
        :key="idx"
        :label="row.label"
        :to="resourceRoute(row.type, row.stateNames)"
        :color="row.color"
        :counts="row.counts"
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
      />
    </Card>
    <Card
      v-if="layout.hero"
      class="state-card bento-hero"
      :class="['state-card--' + layout.hero.color, 'bento-hero--' + layout.heroMode]"
    >
      <ResourceRow
        v-for="(row, idx) in layout.hero.rows"
        :key="idx"
        :label="row.label"
        :to="resourceRoute(row.type, row.stateNames)"
        :color="row.color"
        :counts="row.counts"
      />
    </Card>
  </div>
</template>

<style lang="scss" scoped>
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-flow: dense;
  gap: 15px;

  .bento-hero {
    grid-column: 3;
    grid-row: 1 / -1;

    &--full {
      grid-column: 1 / -1;

      :deep(.body) {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px 48px;
      }
    }

    &--wide {
      grid-column: 2 / -1;

      :deep(.body) {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 4px 48px;
      }
    }
  }

  .bento-sub-hero {
    grid-column: 2;
    grid-row: 1 / -1;
  }

  .bento-grid--has-sub-hero {
    .state-card:not(.bento-hero):not(.bento-sub-hero) {
      grid-column: 1;
    }
  }

  .state-card {
    border: 0;
    :deep(.resource-row) {
      position: relative;
      padding-left: 20px;
      line-height: 21px;
      height: 24px;

      .left {
        flex-grow: 1;
      }

      .right .counts .state-dot {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
      }
    }

    @each $color in (error, warning, info, success, disabled) {
      &--#{$color} {
        background: var(--#{$color}-banner-bg, rgba(var(--#{$color}-rgb), 0.1));
      }
    }
  }
}
</style>
