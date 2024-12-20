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

const handleKeydown = (e: KeyboardEvent) => {
  const activeItem = document.activeElement;

  const items = fields?.value?.querySelectorAll('[dropdown-menu-item]');
  const itemsArr: Element[] = [];

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
</script>

<template>
  <div
    ref="dropdownMenuItem"
    dropdown-menu-item
    tabindex="-1"
    role="menuitem"
    @keydown.up.down="handleKeydown"
  >
    <slot name="default">
      <!--Empty slot content-->
    </slot>
  </div>
</template>
