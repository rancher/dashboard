<script setup lang="ts">
/**
 * An item for a dropdown menu. Used in conjunction with RcDropdown.
 */
import { useDropdownItem } from '@components/RcDropdown/useDropdownItem';

const props = defineProps({ disabled: Boolean });
const emits = defineEmits(['click']);

const {
  handleKeydown,
  close,
  handleActivate,
  scrollIntoView,
} = useDropdownItem();

const handleClick = (e: MouseEvent) => {
  if (props.disabled) {
    return;
  }

  emits('click', e);
  close();
};

</script>

<template>
  <div
    ref="dropdownMenuItem"
    dropdown-menu-item
    tabindex="-1"
    role="menuitem"
    :disabled="disabled || null"
    :aria-disabled="disabled || false"
    @click.stop="handleClick"
    @keydown.enter.space="handleActivate"
    @keydown.up.down.prevent.stop="handleKeydown"
    @mousedown.prevent="() => {/*We use this to prevent clicks from triggering the @focusin below. When we scroll on a click it prevents the action from occurring on the first click.*/}"
    @focusin="scrollIntoView"
  >
    <slot name="before">
      <!--Empty slot content-->
    </slot>
    <slot name="default">
      <!--Empty slot content-->
    </slot>
  </div>
</template>

<style lang="scss" scoped>
  [dropdown-menu-item] {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 9px 8px;
    margin: 0 9px;
    border-radius: 4px;

    &:hover {
      cursor: pointer;
      background-color: var(--dropdown-hover-bg);
    }
    &:focus-visible, &:focus {
      @include focus-outline;
      outline-offset: 0;
    }
    &[disabled] {
      color: var(--disabled-text);
      &:hover {
        cursor: not-allowed;
      }
    }
  }
</style>
