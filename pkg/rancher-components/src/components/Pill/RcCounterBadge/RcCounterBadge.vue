<script setup lang="ts">
import { RcCounterBadgeProps } from '@components/Pill/RcCounterBadge/types';
import { computed } from 'vue';
const props = withDefaults(defineProps<RcCounterBadgeProps>(), { disabled: false });
const displayCount = computed(() => props.count < 1000 ? props.count : '999+');
</script>

<template>
  <div
    class="rc-counter-badge"
    :class="{[props.type]: true, disabled: props.disabled}"
  >
    {{ displayCount }}
  </div>
</template>

<style lang="scss" scoped>
.rc-counter-badge {
    display: inline-flex;
    padding: 1px 8px;
    align-items: center;
    gap: 8px;

    border-radius: 30px;
    border: 1px solid var(--rc-active-border);

    overflow: hidden;
    text-overflow: ellipsis;
    font-family: Lato;
    font-size: 13px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
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
