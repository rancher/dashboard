<script lang="ts">
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import Scaler from '@shell/components/Resource/Detail/Card/Scaler.vue';
import VerticalGap from '@shell/components/Resource/Detail/Card/VerticalGap.vue';
import StatusBar from '@shell/components/Resource/Detail/StatusBar.vue';
import StatusRow from '@shell/components/Resource/Detail/StatusRow.vue';
import { useI18n } from '@shell/composables/useI18n';
import { StateColor } from '@shell/utils/style';
import { computed } from 'vue';
import { useStore } from 'vuex';
import { colorForState as colorForStateFn, stateDisplay as stateDisplayFn } from '@shell/plugins/dashboard-store/resource-class';
import type { SummaryResult } from '@shell/components/Resource/Detail/Card/StateCard/composables';

export interface Props {
  title: string;
  resources?: any[];
  summaryData?: SummaryResult | null;
  showScaling?: boolean;
  noResourcesMessage?: string;
}
</script>

<script setup lang="ts">
const store = useStore();
const i18n = useI18n(store);

const props = withDefaults(defineProps<Props>(), {
  resources:          undefined,
  summaryData:        undefined,
  showScaling:        false,
  noResourcesMessage: undefined
});
const emit = defineEmits(['decrease', 'increase']);

const summaryStateCounts = computed(() => {
  const summary = props.summaryData?.summary;

  if (!summary?.length) {
    return null;
  }

  const entry = summary.find((s) => s.property === 'metadata.state.name');

  return entry?.counts || null;
});

const segmentAccumulator = computed(() => {
  interface Value {
    count: number;
  }
  const accumulator: {[key in StateColor]?: Value} = {};
  const stateCounts = summaryStateCounts.value;

  if (stateCounts) {
    for (const [state, stateCount] of Object.entries(stateCounts)) {
      const colorRaw = colorForStateFn(state) as string;
      const color = (colorRaw?.replace('text-', '') || 'disabled') as StateColor;

      accumulator[color] = accumulator[color] || { count: 0 };
      accumulator[color].count += stateCount.total;
    }
  } else {
    props.resources?.forEach((resource: any) => {
      const color: StateColor = resource.stateSimpleColor || 'disabled';

      accumulator[color] = accumulator[color] || { count: 0 };
      accumulator[color].count++;
    });
  }

  return accumulator;
});

const rowAccumulator = computed(() => {
  interface Value {
    count: number;
    color: StateColor;
  }
  const accumulator: {[key in string]: Value} = {};
  const stateCounts = summaryStateCounts.value;

  if (stateCounts) {
    for (const [state, stateCount] of Object.entries(stateCounts)) {
      const display = stateDisplayFn(state) as string;
      const colorRaw = colorForStateFn(state) as string;
      const color = (colorRaw?.replace('text-', '') || 'disabled') as StateColor;

      accumulator[display] = accumulator[display] || { count: 0, color };
      accumulator[display].count += stateCount.total;
    }
  } else {
    props.resources?.forEach((resource: any) => {
      const color = (resource.stateSimpleColor?.replace('text-', '') || 'disabled') as StateColor;

      accumulator[resource.stateDisplay] = accumulator[resource.stateDisplay] || { count: 0, color };
      accumulator[resource.stateDisplay].count++;
    });
  }

  return accumulator;
});

const percent = (count: number, total: number) => {
  return total > 0 ? count / total * 100 : 0;
};

const count = computed(() => {
  if (summaryStateCounts.value) {
    return props.summaryData?.count ?? 0;
  }

  return props.resources?.length ?? 0;
});

const segmentColors = computed(() => Object.keys(segmentAccumulator.value) as StateColor[]);
const segments = computed(() => segmentColors.value.map((color: StateColor) => ({
  color,
  percent: percent(segmentAccumulator.value[color]?.count || 0, count.value)
})));

const rowStates = computed(() => {
  return Object.keys(rowAccumulator.value);
});

const rows = computed(() => {
  return rowStates.value.map((state) => ({
    color:   rowAccumulator.value[state].color,
    label:   state,
    count:   rowAccumulator.value[state].count,
    percent: percent(rowAccumulator.value[state].count, count.value)
  }));
});

</script>

<template>
  <Card
    :title="title"
    data-testid="resource-detail-status-card"
  >
    <template
      v-if="props.showScaling"
      #heading-action
    >
      <Scaler
        :ariaResourceName="i18n.t('component.resource.detail.card.podsCard.ariaResourceName')"
        :value="count"
        :min="0"
        @increase="(newValue) => emit('increase', newValue)"
        @decrease="(newValue) => emit('decrease', newValue)"
      />
    </template>
    <StatusBar
      v-if="rows.length > 0"
      :segments="segments"
    />
    <VerticalGap v-if="rows.length > 0" />
    <div
      v-if="rows.length > 0"
      class="pod-distribution"
    >
      <StatusRow
        v-for="(row, i) in rows"
        :key="i"
        :color="row.color"
        :label="row.label"
        :count="row.count"
        :percent="row.percent"
      />
    </div>
    <div
      v-else-if="props.noResourcesMessage"
      class="text-deemphasized"
    >
      {{ props.noResourcesMessage }}
    </div>
  </Card>
</template>

<style lang="scss" scoped>
.pod-distribution {
    display: flex;
    flex-direction: column;
}
</style>
