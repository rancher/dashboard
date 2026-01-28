<script setup lang="ts">
import RcButton from '@components/RcButton/RcButton.vue';
import { RcTagProps } from './types';

const props = withDefaults(defineProps<RcTagProps>(), {
  disabled: false, showClose: false, highlight: undefined
});
const emit = defineEmits(['close']);
</script>

<template>
  <div
    class="rc-tag"
    :class="{[props.type]: true, disabled: props.disabled, highlight: props.highlight}"
  >
    <slot name="default" />
    <RcButton
      v-if="props.showClose"
      variant="ghost"
      :aria-label="props.closeAriaLabel"
      @click="emit('close')"
    >
      <i class="icon icon-close" />
    </RcButton>
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
    color: var(--body-text);

    button {
      $size: 12px;
      padding: 0;
      line-height: $size;
      min-height: $size;
      background: none;

      &, .icon-close {
        width: $size;
        height: $size;
        font-size: $size;
      }
    }

    &.disabled button {
      cursor: not-allowed;
    }

    &.active {
        border-color: var(--rc-active-border);
        background: var(--rc-active-background);
        cursor: pointer;

        &.highlight, &:hover {
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
