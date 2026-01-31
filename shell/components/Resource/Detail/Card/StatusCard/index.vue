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

export interface Props {
  title: string;
  resources?: any[];
  showScaling?: boolean;
}
</script>

<script setup lang="ts">
const store = useStore();
const i18n = useI18n(store);

const props = withDefaults(defineProps<Props>(), { resources: undefined, showScaling: false });
const emit = defineEmits(['decrease', 'increase']);

const segmentAccumulator = computed(() => {
  interface Value {
    count: number;
  }
  const accumulator: {[key in StateColor]?: Value} = {};

  props.resources?.forEach((resource: any) => {
    const color: StateColor = resource.stateSimpleColor;

    accumulator[color] = accumulator[color] || { count: 0 };
    accumulator[color].count++;
  });

  return accumulator;
});

const rowAccumulator = computed(() => {
  interface Value {
    count: number;
    color: StateColor;
  }
  const accumulator: {[key in string]: Value} = {};

  props.resources?.forEach((resource: any) => {
    accumulator[resource.stateDisplay] = accumulator[resource.stateDisplay] || { count: 0 };
    accumulator[resource.stateDisplay].count++;
    accumulator[resource.stateDisplay].color = resource.stateSimpleColor.replace('text-', '') as StateColor;
  });

  return accumulator;
});

const percent = (count: number, total: number) => {
  return count / total * 100;
};

const count = computed(() => props.resources?.length || 0);

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
    <StatusBar :segments="segments" />
    <VerticalGap />
    <div class="pod-distribution">
      <StatusRow
        v-for="(row, i) in rows"
        :key="i"
        :color="row.color"
        :label="row.label"
        :count="row.count"
        :percent="row.percent"
      />
    </div>
  </Card>
</template>

<style lang="scss" scoped>
.pod-distribution {
    display: flex;
    flex-direction: column;
}
</style>
