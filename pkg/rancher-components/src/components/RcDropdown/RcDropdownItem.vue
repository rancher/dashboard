<script setup lang="ts">
import { inject, Ref, ref } from 'vue';

type DropdownCollection = {
  register: (field: HTMLElement | null) => void;
  fields: Ref<HTMLElement | null>;
};

const defaultCollection: DropdownCollection = {
  register: (_field: HTMLElement | null) => null,
  fields:   ref(null),
};

const { fields } = inject<DropdownCollection>('dropdownCollection') || defaultCollection;

type DropdownContext = {
  close: () => void;
}

const defaultContext: DropdownContext = { close: () => null };

const { close } = inject<DropdownContext>('dropdownContext') || defaultContext;

const handleKeydown = (e: KeyboardEvent) => {
  const activeItem = document.activeElement;

  const items = fields?.value?.querySelectorAll('[dropdown-menu-item]');
  const itemsArr: Element[] = [];

  /**
   * ⚠️ We build up an items array on each keydown? I'm sure that we can do this
   * higher up the chain and inject the result into the component.
   */
  items?.forEach((element) => {
    itemsArr.push(element);
  });

  const activeIndex = itemsArr.indexOf(activeItem || new HTMLElement());

  if (activeIndex < 0) {
    return;
  }

  const shouldAdvance = e.key === 'ArrowDown';

  const newIndex = findNewIndex(shouldAdvance, activeIndex, itemsArr);

  if (itemsArr[newIndex] instanceof HTMLElement) {
    itemsArr[newIndex].focus();
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
    @keydown.enter="handleActivate"
    @keydown.space="handleActivate"
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
