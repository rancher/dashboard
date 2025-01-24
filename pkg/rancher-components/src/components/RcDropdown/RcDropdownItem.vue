<script setup lang="ts">
import { inject } from 'vue';
import { DropdownCollection, defaultCollection, DropdownContext, defaultContext } from './RcDropdown'

const props = defineProps({ disabled: Boolean });
const emits = defineEmits(['click']);

const { dropdownItems } = inject<DropdownCollection>('dropdownCollection') || defaultCollection;
const { close } = inject<DropdownContext>('dropdownContext') || defaultContext;

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

const handleClick = () => {
  if (props.disabled) {
    return;
  }

  emits('click');
  close();
};

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
    <slot name="default">
      <!--Empty slot content-->
    </slot>
  </div>
</template>

<style lang="scss" scoped>
  [dropdown-menu-item] {
    padding: 10px;
    &:hover {
      cursor: pointer;
      background-color: var(--dropdown-hover-bg);
      color: var(--dropdown-hover-text);
    }
    &:focus-visible {
      @include focus-outline;
      outline-offset: -2px;
    }
    &[disabled] {
      color: var(--disabled-text);
      &:hover {
        cursor: not-allowed;
      }
    }
  }
</style>
