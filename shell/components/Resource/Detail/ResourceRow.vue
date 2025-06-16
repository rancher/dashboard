<script lang="ts">
import SubtleLink from '@shell/components/SubtleLink.vue';
import { StateColor, stateColorCssVar } from '@shell/utils/style';
import { sortBy } from 'lodash';
import { RouteLocationRaw } from 'vue-router';

export interface Count {
  label: string;
  count: number;
}

export interface Props {
  label: string;
  to?: RouteLocationRaw;
  color?: StateColor;
  counts?: Count[];
}

export function extractCounts(labels: string[]): Count[] {
  const accumulator: { [k: string]: number} = {};

  labels.forEach((l: string) => {
    accumulator[l] = accumulator[l] || 0;
    accumulator[l]++;
  });

  const counts: Count[] = Object.entries(accumulator).map(([label, count]) => ({ label, count }));

  return sortBy(counts, 'label');
}

</script>

<script setup lang="ts">
const {
  label, to, counts, color
} = defineProps<Props>();
</script>

<template>
  <div class="resource-row">
    <div class="left">
      <SubtleLink
        v-if="to"
        :to="to"
      >
        {{ label }}
      </SubtleLink>
      <span
        v-else
        class="text-muted"
      >
        {{ label }}
      </span>
    </div>
    <div class="right">
      <div
        v-if="!counts || counts.length == 0"
        class="text-muted"
      >
        &mdash;
      </div>
      <div
        v-else
        class="counts"
      >
        <span
          v-if="color"
          class="dot"
          :style="{backgroundColor: stateColorCssVar(color)}"
        >
&nbsp;
        </span>
        <span
          v-for="count in counts"
          :key="count.label"
          class="count"
        >
          {{ count.count }} {{ count.label }}<span class="and">&nbsp;+&nbsp;</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.resource-row {
    display: flex;
    flex-direction: row;
    align-items: center;

    .right {
      flex-grow: 1;
      text-align: right;
    }

    .counts {
      display: inline-flex;
      flex-direction: row;
      justify-content: flex-end;
      align-items: center;
    }

    .count:last-of-type .and {
      display: none;
    }

    .dot {
      display: inline-block;

      $size: 6px;
      width: $size;
      height: $size;

      border-radius: 50%;
      margin-right: 10px;
    }
}
</style>
