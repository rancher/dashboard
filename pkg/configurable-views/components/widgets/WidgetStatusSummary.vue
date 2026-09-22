<script setup lang="ts">
import { computed } from 'vue';
import ProgressBarMulti from '@shell/components/ProgressBarMulti.vue';
import { colorForState, stateSort } from '@shell/plugins/dashboard-store/resource-class';
import { ucFirst } from '@shell/utils/string';
import { sortBy } from '@shell/utils/sort';
import WidgetCard from './WidgetCard.vue';
import { useWidgetRows } from '../../composables/useWidgetRows';
import { groupRows } from '../../templating/widget-data';
import type { WidgetSpec } from '../../templating/types';

/**
 * Items grouped by state, drawn by Rancher's own ProgressBarMulti — the component behind every
 * state breakdown in the product. `colorForState` and `stateSort` come with it, so "Error" is the
 * same red here as everywhere else and the worst states sort to the front, which a hand-rolled bar
 * would not get right for a state it had never been taught.
 */
const props = defineProps<{ widget: WidgetSpec }>();

const {
  rows, loading, error, emptyText
} = useWidgetRows(() => props.widget);

/** ProgressBarMulti's shape: { label, color (a bg-* class), value }, worst first. */
const parts = computed(() => {
  const groups = groupRows(rows.value, props.widget.groupBy || 'state').map((g: { label: string; count: number }) => {
    const textColor = colorForState(g.label);

    return {
      label: ucFirst(g.label),
      color: textColor.replace(/text-/, 'bg-'),
      textColor,
      value: g.count,
      sort:  stateSort(textColor, g.label),
    };
  });

  return sortBy(groups, 'sort:desc');
});
</script>

<template>
  <WidgetCard
    :title="widget.title"
    :count="loading || error ? null : rows.length"
    :loading="loading"
    :error="error"
    :empty="!parts.length"
    :empty-text="emptyText"
  >
    <ProgressBarMulti
      :values="parts"
      class="mb-20"
    />
    <ul class="wstatus__legend">
      <li
        v-for="part in parts"
        :key="part.label"
      >
        <span
          class="wstatus__dot"
          :class="part.color"
        />
        <span class="wstatus__name">{{ part.label }}</span>
        <span class="wstatus__count">{{ part.value }}</span>
      </li>
    </ul>
  </WidgetCard>
</template>

<style lang="scss" scoped>
.wstatus {
  &__legend {
    display:        flex;
    flex-direction: column;
    gap:            8px;
    list-style:     none;
    margin:         0;
    padding:        0;

    li {
      align-items: center;
      display:     flex;
      gap:         8px;
    }
  }

  &__dot {
    border-radius: 2px;
    display:       inline-block;
    height:        9px;
    width:         9px;
  }

  &__name {
    flex: 1 1 auto;
  }

  &__count {
    font-weight: 600;
  }
}
</style>
