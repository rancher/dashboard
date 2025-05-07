<script setup lang="ts">
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import PercentageBar from '@shell/components/Resource/Detail/PercentageBar.vue';
import { computed } from 'vue';

export interface Props {
    title: string;
    unit?: string;
    used: number;
    usedFormatter?: (n: number) => string;
    available: number;
    availableFormatter?: (n: number) => string
}

const {
  title, unit, used, usedFormatter, available, availableFormatter
} = withDefaults(
  defineProps<Props>(),
  {
    usedFormatter:      (n: number) => n.toString(),
    availableFormatter: (n: number) => n.toString(),
    unit:               undefined
  }
);

const percentage = computed(() => {
  const numerator = used || 0;
  const denominator = available || 0;

  return denominator === 0 ? 0 : Math.floor((numerator / denominator) * 100);
});
</script>

<template>
  <Card :title="title">
    <div class="numerical">
      <div>Used</div>
      <div>
        {{ usedFormatter(used) }} of {{ availableFormatter(available) }}
        <span
          v-if="unit"
          class="unit"
        >
          {{ unit }}
        </span>
        <span class="spacer">/</span>
        <span class="percentage">{{ percentage }}%</span>
      </div>
    </div>
    <PercentageBar :percent="percentage" />
  </Card>
</template>

<style lang="scss" scoped>
.numerical {
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  margin-bottom: 8px;

  .spacer {
    margin: 0 8px;
  }

  .percentage {
    font-weight: bold;
  }
}
</style>
