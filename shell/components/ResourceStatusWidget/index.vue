<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import type { RouteLocationRaw } from 'vue-router';
import { COUNT } from '@shell/config/types';
import type { StateColor } from '@shell/utils/style';
import { useI18n } from '@shell/composables/useI18n';
import { useStateColor } from '@shell/composables/useStateColor';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import StatusSummaryCard from '@shell/components/Resource/Detail/Card/StatusSummaryCard/index.vue';
import StatusBreakdownCard from '@shell/components/Resource/Detail/Card/StatusBreakdownCard/index.vue';
import type { StatusSummaryCardItem } from '@shell/components/Resource/Detail/Card/StatusSummaryCard/types';
import { buildStatusSummaryCard, compareStateColors } from '@shell/components/Resource/Detail/Card/StatusSummaryCard/utils';
import type { StatusBreakdownRow } from '@shell/components/Resource/Detail/Card/StatusBreakdownCard/types';
import { useResourceStateSummaries } from './useResourceStateSummaries';
import type { ResourceStatusWidgetConfig } from './types';

/**
 * A self contained status card for one or more resource types of the current cluster. Everything it
 * shows is described by `config`, it fetches its own counts and keeps them up to date.
 *
 * The `empty` slot replaces the message shown when there is nothing to list.
 */
const props = defineProps<{ config: ResourceStatusWidgetConfig }>();

defineSlots<{ empty?:() => unknown }>();

/**
 * Colors the count API reports, it only lists states that are in an error or in-progress state
 */
const COUNTED_COLORS: StateColor[] = ['error', 'warning', 'info'];

const store = useStore();
const { t } = useI18n(store);
const { toStateColor } = useStateColor();

const clusterId = computed<string>(() => store.getters['clusterId']);

const counts = computed<Record<string, { summary?: { states?: Record<string, number> } }>>(() => store.getters['cluster/all'](COUNT)?.[0]?.counts || {});

function canShow(type: string): boolean {
  const schema = store.getters['cluster/schemaFor'](type);

  return !!schema && !!store.getters['cluster/canList'](type) && !store.getters['type-map/isIgnored'](schema);
}

/**
 * When only error, warning or info states are counted, types the count API reports nothing for can be
 * skipped without fetching their summary
 */
function hasCountedStates(type: string): boolean {
  return Object.values(counts.value[type]?.summary?.states || {}).some((n) => n > 0);
}

const types = computed<string[]>(() => {
  const config = props.config;

  if (config.kind === 'summary') {
    return canShow(config.resource) ? [config.resource] : [];
  }

  const onlyCountedColors = !!config.colors?.length && config.colors.every((c) => COUNTED_COLORS.includes(c));

  return config.resources.filter((type) => canShow(type) && (!onlyCountedColors || hasCountedStates(type)));
});

const { loaded, stateCounts } = useResourceStateSummaries(types, {
  property:              () => props.config.property,
  followNamespaceFilter: () => props.config.followNamespaceFilter,
});

function resourceRoute(type: string, stateNames?: string[]): RouteLocationRaw {
  const loc: { name: string; params: Record<string, string>; query?: Record<string, string> } = {
    name:   'c-cluster-product-resource',
    params: {
      cluster:  clusterId.value,
      product:  'explorer',
      resource: type,
    },
  };

  if (stateNames?.length) {
    loc.query = { stateFilter: stateNames.join(',') };
  }

  return loc;
}

function typeLabel(type: string): string {
  const schema = store.getters['cluster/schemaFor'](type);

  return schema ? store.getters['type-map/labelFor'](schema, 2) : type;
}

const title = computed<string>(() => props.config.title || (props.config.kind === 'summary' ? typeLabel(props.config.resource) : ''));

const summaryCard = computed<StatusSummaryCardItem | null>(() => {
  const config = props.config;

  if (config.kind !== 'summary' || !types.value.length) {
    return null;
  }

  const states = stateCounts(config.resource);

  if (!states) {
    return null;
  }

  return buildStatusSummaryCard({
    key:    config.resource,
    title:  title.value,
    to:     resourceRoute(config.resource),
    states: Object.entries(states).map(([name, count]) => ({
      name, count, color: toStateColor(name, config.resource)
    })),
    stateRoute: (name) => resourceRoute(config.resource, [name]),
  });
});

function breakdownRow(type: string, colors?: StateColor[]): StatusBreakdownRow | null {
  const states = stateCounts(type);

  if (!states) {
    return null;
  }

  const byColor: Partial<Record<StateColor, { count: number; stateNames: string[] }>> = {};

  for (const [state, count] of Object.entries(states)) {
    const color = toStateColor(state, type);

    if (!count || (colors?.length && !colors.includes(color))) {
      continue;
    }

    byColor[color] = byColor[color] || { count: 0, stateNames: [] };
    byColor[color].count += count;
    byColor[color].stateNames.push(state);
  }

  const sortedColors = Object.keys(byColor).sort(compareStateColors) as StateColor[];

  if (!sortedColors.length) {
    return null;
  }

  return {
    key:    type,
    label:  typeLabel(type),
    to:     resourceRoute(type),
    counts: sortedColors.map((color) => ({
      color,
      count: byColor[color]!.count,
      to:    resourceRoute(type, byColor[color]!.stateNames),
    })),
  };
}

const breakdownRows = computed<StatusBreakdownRow[] | null>(() => {
  const config = props.config;

  if (config.kind !== 'breakdown' || !loaded.value) {
    return null;
  }

  return types.value
    .map((type) => breakdownRow(type, config.colors))
    .filter((row): row is StatusBreakdownRow => !!row)
    .sort((a, b) => a.label.localeCompare(b.label));
});

// A summary card for a type the user cannot list is not shown at all
const loading = computed<boolean>(() => !loaded.value && (props.config.kind === 'breakdown' || !!types.value.length));
</script>

<template>
  <StatusSummaryCard
    v-if="summaryCard"
    :title="summaryCard.title"
    :total="summaryCard.total"
    :segments="summaryCard.segments"
    :rows="summaryCard.rows"
    :to="summaryCard.to"
  >
    <template #empty>
      <slot name="empty">
        <span class="text-deemphasized">{{ t('generic.none') }}</span>
      </slot>
    </template>
  </StatusSummaryCard>
  <StatusBreakdownCard
    v-else-if="breakdownRows"
    :title="title"
    :rows="breakdownRows"
  >
    <template #empty>
      <slot name="empty">
        <span class="text-deemphasized">{{ t('generic.none') }}</span>
      </slot>
    </template>
  </StatusBreakdownCard>
  <Card
    v-else-if="loading"
    :title="title"
    data-testid="resource-status-widget-loading"
  >
    <i
      class="icon icon-lg icon-spinner icon-spin loading-icon"
      :aria-label="t('component.resource.detail.glance.ariaLabel.loading')"
    />
  </Card>
</template>

<style lang="scss" scoped>
// The card body is a flex column. Without this the icon stretches to the card width and its line
// height is shorter than the glyph, so it spins around an off center point
.loading-icon {
  align-self: flex-start;
  line-height: 1;
}
</style>
