<script setup lang="ts">
import { inject, Ref, ref } from 'vue';

type DropdownCollection = {
  dropdownItems: Ref<Element[]>;
};

const defaultCollection: DropdownCollection = { dropdownItems: ref([]) };

const { dropdownItems } = inject<DropdownCollection>('dropdownCollection') || defaultCollection;

type DropdownContext = {
  close: () => void;
}

const defaultContext: DropdownContext = { close: () => null };

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
    aria-disabled="false"
    @click="close"
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
    cursor: pointer;
    &:hover {
      background-color: var(--dropdown-hover-bg);
      color: var(--dropdown-hover-text);
    }
    &:focus-visible {
      @include focus-outline;
      outline-offset: -2px;
    }
  }
</style>
