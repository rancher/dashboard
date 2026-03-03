<script setup lang="ts">
import { RcCounterBadgeProps } from './types';
import { computed } from 'vue';
const props = withDefaults(defineProps<RcCounterBadgeProps>(), { disabled: false });
const displayCount = computed(() => props.count < 1000 ? props.count : '999+');
</script>

<template>
  <div
    class="rc-counter-badge"
    :class="{[props.type]: true, disabled: props.disabled}"
    data-testid="rc-counter-badge"
  >
    <span class="count">{{ displayCount }}</span>
  </div>
</template>

<style lang="scss" scoped>
.rc-counter-badge {
    box-sizing: border-box;
    height: 21px;
    
    display: inline-flex;
    padding: 2px 8px;
    align-items: center;

    border-radius: 30px;
    border: 1px solid var(--rc-active-border);

    font-family: Lato;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 17px;
    color: var(--body-text);

    &.active {
        border-color: var(--rc-active-border);
        background: var(--rc-active-background);
        cursor: pointer;

        &:hover {
            border-color: var(--rc-primary-hover);
            background: var(--rc-active-background);
        }

        &.disabled {
            border-color: var(--rc-active-border);
            background: var(--rc-active-disabled-background);
            color: var(--rc-disabled-text-color);

            cursor: not-allowed;
        }
    }

    &.inactive {
        background: var(--rc-inactive-background);
        border-color: var(--rc-inactive-border);

        &.disabled {
            border-color: var(--rc-inactive-disabled-border);
            color: var(--rc-disabled-text-color);
        }
    }
}
</style>
