<script setup lang="ts">
import { computed } from 'vue';

export interface Props {
  percent: number;
  percentageColor?: string;
  baseColor?: string;
}

const { percent, percentageColor, baseColor } = withDefaults(
  defineProps<Props>(),
  {
    baseColor:       'var(--progress-bg)',
    percentageColor: 'var(--primary)'
  }
);

const baseStyle = computed(() => ({ backgroundColor: baseColor }));
const usedStyle = computed(() => ({
  backgroundColor: percentageColor,
  width:           `${ percent }%`
}));
</script>

<template>
  <div
    class="percentage-bar"
    :style="baseStyle"
  >
    <div
      class="used"
      :style="usedStyle"
    >
&nbsp;
    </div>
  </div>
</template>

<style lang="scss" scoped>
.percentage-bar {
  border-radius: var(--border-radius-medium);
  height: 16px;
  overflow: hidden;
}
</style>
