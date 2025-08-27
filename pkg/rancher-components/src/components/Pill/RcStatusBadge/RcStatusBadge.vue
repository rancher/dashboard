<script setup lang="ts">
import { RcStatusBadgeProps } from './types';

const props = defineProps<RcStatusBadgeProps>();
</script>

<template>
  <div
    class="rc-status-badge"
    :class="{[props.status]: true}"
  >
    <slot name="default" />
  </div>
</template>

<style lang="scss" scoped>
.rc-status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1px 7px;

    border: 1px solid transparent;
    border-radius: 30px;

    font-family: Lato;
    font-size: 12px;
    line-height: 19px;

    &.info {
        background-color: var(--rc-info-secondary);
        border-color: var(--rc-info-secondary);
        color: var(--rc-info);
    }

    &.success {
        background-color: var(--rc-success-secondary);
        border-color: var(--rc-success-secondary);
        color: var(--rc-success);
    }

    &.warning {
        background-color: var(--rc-warning);
        border-color: var(--rc-warning);
        color: var(--rc-warning-secondary);
    }

    &.error {
        background-color: var(--rc-error);
        border-color: var(--rc-error);
        color: var(--rc-error-secondary);
    }

    &.unknown {
        background-color: var(--rc-unknown);
        border-color: var(--rc-unknown);
        color: var(--rc-unknown-secondary);
    }

    &.none {
        border-color: var(--rc-none);
        color: var(--rc-none-secondary);
    }
}
</style>
