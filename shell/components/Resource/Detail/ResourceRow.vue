<script setup lang="ts">
import SubtleLink from '@shell/components/SubtleLink.vue';
import { RouteLocationRaw } from 'vue-router';

export interface Count {
  label: string;
  count: number;
}

export interface Props {
        label: string;
        to?: RouteLocationRaw;
        color?: string;
        counts?: Count[];
}

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
          :style="{backgroundColor: color}"
        >
&nbsp;
        </span>
        <span
          v-for="(count, i) in counts"
          :key="i"
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
