<script setup lang="ts">
/**
 * An item for a dropdown menu. Used in conjunction with RcDropdown.
 */
import { inject } from 'vue';
import { DropdownContext, defaultContext } from './types';

const props = defineProps({ disabled: Boolean });
const emits = defineEmits(['click']);

const { close, dropdownItems } = inject<DropdownContext>('dropdownContext') || defaultContext;

/**
 * Handles keydown events to navigate between dropdown items.
 * @param {KeyboardEvent} e - The keydown event.
 */
const handleKeydown = (e: KeyboardEvent) => {
  const activeItem = document.activeElement;

  const activeIndex = dropdownItems.value.indexOf(activeItem || new HTMLElement());

  if (activeIndex < 0) {
    return;
  }

  const shouldAdvance = e.key === 'ArrowDown';

  const newIndex = findNewIndex(shouldAdvance, activeIndex, dropdownItems.value);

  if (dropdownItems.value[newIndex] instanceof HTMLElement) {
    dropdownItems.value[newIndex].focus();
  }
};

/**
 * Finds the new index for the dropdown item based on the key pressed.
 * @param shouldAdvance - Whether to advance to the next or previous item.
 * @param activeIndex - Current active index.
 * @param itemsArr - Array of dropdown items.
 * @returns The new index.
 */
const findNewIndex = (shouldAdvance: boolean, activeIndex: number, itemsArr: Element[]) => {
  const newIndex = shouldAdvance ? activeIndex + 1 : activeIndex - 1;

  if (newIndex > itemsArr.length - 1) {
    return 0;
  }

  if (newIndex < 0) {
    return itemsArr.length - 1;
  }

  return newIndex;
};

const handleClick = (e: MouseEvent) => {
  if (props.disabled) {
    return;
  }

  emits('click', e);
  close();
};

/**
 * Handles keydown events to activate the dropdown item.
 * @param e - The keydown event.
 */
const handleActivate = (e: KeyboardEvent) => {
  if (e?.target instanceof HTMLElement) {
    e?.target?.click();
  }
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
    @keydown.up.down.stop="handleKeydown"
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
