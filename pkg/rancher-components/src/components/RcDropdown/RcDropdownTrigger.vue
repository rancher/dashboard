<script setup lang="ts">
import { inject, onMounted, useTemplateRef } from 'vue';
import { RcButton, RcButtonType } from '@components/RcButton';
import { DropdownContext, defaultContext } from './types';

const {
  handleKeydown,
  showMenu,
  registerTrigger,
  focusFirstElement,
  isMenuOpen,
} = inject<DropdownContext>('dropdownContext') || defaultContext;

const dropdownTrigger = useTemplateRef<RcButtonType>('dropdownTrigger');

onMounted(() => {
  registerTrigger(dropdownTrigger.value);
});

const focus = () => {
  dropdownTrigger?.value?.focus();
};

defineExpose({ focus });
</script>

<template>
  <RcButton
    ref="dropdownTrigger"
    role="button"
    aria-haspopup="menu"
    :aria-expanded="isMenuOpen"
    @keydown="handleKeydown"
    @keydown.down="focusFirstElement"
    @keydown.escape="showMenu(false)"
    @click="showMenu(true)"
  >
    <slot name="default">
      <!--Empty slot content-->
    </slot>
  </RcButton>
</template>
