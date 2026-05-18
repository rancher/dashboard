<script setup lang="ts">
import { RcCounterBadge } from '@components/Pill';
import SubtleLink from '@shell/components/SubtleLink.vue';
import { StateColor, stateColorCssVar } from '@shell/utils/style';
import type { RouteLocationRaw } from 'vue-router';

export interface Props {
        color: StateColor;
        label: string;
        count: number;
        percent: number;
        showPercent?: boolean;
        to?: RouteLocationRaw;
}

const {
  color, label, count, percent, showPercent = true, to
} = defineProps<Props>();
</script>

<template>
  <div class="status-row">
    <div
      class="indicator"
      :style="{backgroundColor: stateColorCssVar(color)}"
    />
    <div class="label">
      <SubtleLink
        v-if="to"
        :to="to"
      >
        {{ label }}
      </SubtleLink>
      <template v-else>
        {{ label }}
      </template>
    </div>
    <div class="count">
      <RcCounterBadge
        :count="count"
        type="inactive"
      />
    </div>
    <div
      v-if="showPercent"
      class="percent text-muted"
    >
      {{ percent.toFixed(1) }}%
    </div>
  </div>
</template>

<style lang="scss" scoped>
.status-row {
    display: flex;
    flex-direction: row;
    align-items: center;

    &:not(:first-of-type) {
      margin-top: 8px;
    }

    .label {
      flex-grow: 1;
    }

    .indicator {
      height: 4px;
      border-radius: 4px;
      width: 20px;
      margin-right: 10px;
    }

    .percent {
      width: 60px;
      text-align: right;
    }
}
</style>
