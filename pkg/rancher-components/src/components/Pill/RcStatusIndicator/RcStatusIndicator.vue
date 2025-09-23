<script setup lang="ts">
import { RcStatusIndicatorProps } from './types';

const props = defineProps<RcStatusIndicatorProps>();
</script>

<template>
  <div class="rc-status-indicator">
    <div
      class="shape"
      :class="{[props.shape]: true, [props.status]: true}"
    />
  </div>
</template>

<style lang="scss" scoped>
.rc-status-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 21px;

    .shape {
        display: inline-block;
        border: 1px solid transparent;

        &.disc {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }

        &.horizontal-bar {
            width: 16px;
            height: 4px;
            border-radius: 2px;
        }

        &.vertical-bar {
            width: 4px;
            height: 16px;
            border-radius: 2px;
        }

        &.info {
            background-color: var(--rc-info);
            border-color: var(--rc-info);
        }

        &.success {
            background-color: var(--rc-success);
            border-color: var(--rc-success);
        }

        &.warning {
            background-color: var(--rc-warning);
            border-color: var(--rc-warning);
        }

        &.error {
            background-color: var(--rc-error);
            border-color: var(--rc-error);
        }

        &.unknown {
            background-color: var(--rc-unknown);
            border-color: var(--rc-unknown);
        }

        &.none {
            border-color: var(--rc-none);
        }
    }
}
</style>
