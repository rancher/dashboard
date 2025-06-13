<script setup lang="ts">
import { stateColorCssVar, StateColor } from '@shell/utils/style';

export interface Segment {
  color: StateColor;
  percent: number;
}

export interface Props {
  segments: Segment[]
}

const { segments } = defineProps<Props>();

const computeStyle = (segment: Segment) => {
  return {
    backgroundColor: stateColorCssVar(segment.color),
    width:           `${ segment.percent }%`
  };
};
</script>

<template>
  <div class="status-bar">
    <div
      v-for="(segment, i) in segments"
      :key="i"
      class="segment"
      :style="computeStyle(segment)"
    >
&nbsp;
    </div>
  </div>
</template>

<style lang="scss" scoped>
.status-bar {
    display: flex;
    flex-direction: row;
    justify-content: center;

    column-gap: 2px;
    height: 21px;

    .segment {
        height: 4px;

        &:first-of-type {
          border-top-left-radius: 4px;
          border-bottom-left-radius: 4px;
        }

        &:last-of-type {
          border-top-right-radius: 4px;
          border-bottom-right-radius: 4px;
        }
    }
}
</style>
