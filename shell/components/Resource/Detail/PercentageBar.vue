<script setup lang="ts">
import { computed } from 'vue';

export interface Props {
  percent: number;
  percentageColor?: string;
  baseColor?: string;
}

const props = withDefaults(
  defineProps<Props>(),
  {
    baseColor:       'var(--progress-bg)',
    percentageColor: 'var(--primary)'
  }
);

const usedWidth = computed(() => `${ props.percent }%`);
</script>

<template>
  <div class="percentage-bar">
    <div class="used" />
  </div>
</template>

<style lang="scss" scoped>
.percentage-bar {
  border-radius: var(--border-radius-md);
  height: 16px;
  overflow: hidden;
  background-color: v-bind('props.baseColor');

  .used {
    height: 100%;
    background-color: v-bind('props.percentageColor');
    width: v-bind('usedWidth')
  }
}
</style>
