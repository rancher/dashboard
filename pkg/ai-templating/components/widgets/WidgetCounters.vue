<script setup lang="ts">
import { computed } from 'vue';
import ResourceSummary from '@shell/components/ResourceSummary.vue';
import { colorForState } from '@shell/plugins/dashboard-store/resource-class';
import { ucFirst } from '@shell/utils/string';
import WidgetCard from './WidgetCard.vue';
import { useWidgetRows } from '../../composables/useWidgetRows';
import { groupRows } from '../../templating/widget-data';
import type { WidgetSpec } from '../../templating/types';

/**
 * Numbers with labels, each one Rancher's own ResourceSummary fed `spoofedCounts` so it reports
 * exactly what this widget's resource and filter selected rather than counting for itself.
 *
 * ResourceSummary and not CountGauge: CountGauge is dead code in the shell — nothing imports it,
 * and the only mentions are a leftover `totalCountGaugeInput` variable that is handed to
 * ResourceSummary anyway.
 */
const props = defineProps<{ widget: WidgetSpec }>();

const {
  rows, loading, error, schema
} = useWidgetRows(() => props.widget);

/** A plural noun for the total, from the resource's own schema so a CRD reads properly too. */
const totalLabel = computed(() => {
  const label = `${ schema.value?.attributes?.kind || props.widget.resource?.split('.').pop() || 'items' }`.toLowerCase();

  return label.endsWith('s') ? label : `${ label }s`;
});

const health = computed(() => rows.value.reduce((acc, row) => {
  const color = colorForState(row.stateDisplay || row.state || '');

  if (color === 'text-error') {
    acc.errorCount += 1;
  } else if (color === 'text-warning') {
    acc.warningCount += 1;
  }

  return acc;
}, { warningCount: 0, errorCount: 0 }));

/**
 * The FIRST card is the total, and it carries the chips — "42 clusters, 3 of them in trouble" is
 * the shape of the question people ask. The rest are the groups, which need no chip because a
 * group IS one state.
 */
const counters = computed(() => {
  const total = {
    key:          '__total',
    name:         totalLabel.value,
    total:        rows.value.length,
    useful:       rows.value.length - health.value.warningCount - health.value.errorCount,
    warningCount: health.value.warningCount,
    errorCount:   health.value.errorCount,
  };

  if (!props.widget.groupBy) {
    return [total];
  }

  const groups = groupRows(rows.value, props.widget.groupBy).map((g: { label: string; count: number }) => ({
    key:          g.label,
    name:         ucFirst(g.label),
    total:        g.count,
    useful:       g.count,
    warningCount: 0,
    errorCount:   0,
  }));

  return [total, ...groups];
});
</script>

<template>
  <WidgetCard
    :title="widget.title"
    :loading="loading"
    :error="error"
  >
    <div class="wcounters">
      <ResourceSummary
        v-for="counter in counters"
        :key="counter.key"
        :spoofed-counts="counter"
      />
    </div>
  </WidgetCard>
</template>

<style lang="scss" scoped>
.wcounters {
  display:               grid;
  gap:                   12px;
  // ResourceSummary lays its number, name and chips out in ONE row, so below about 200px they
  // collide: a narrow widget stacks the cards, a wide one puts several across.
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));

  :deep(.container) {
    height:    100%;
    margin:    0;
    min-width: 0;
  }

  :deep(h1) {
    margin-bottom: 0;
  }
}
</style>
