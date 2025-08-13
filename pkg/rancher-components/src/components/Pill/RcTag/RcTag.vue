<script setup lang="ts">
import { RcTagProps } from '@components/Pill/RcTag/types';

const props = withDefaults(defineProps<RcTagProps>(), { disabled: false });
</script>

<template>
  <div
    class="rc-tag"
    :class="{[props.type]: true, disabled: props.disabled}"
  >
    <slot name="default" />
  </div>
</template>

<style lang="scss" scoped>
.rc-tag {
    display: inline-flex;
    padding: 1px 8px;
    align-items: center;
    gap: 8px;

    border-radius: 4px;
    border: 1px solid var(--rc-active-border);

    overflow: hidden;
    text-overflow: ellipsis;
    font-family: Lato;
    font-size: 13px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;

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
