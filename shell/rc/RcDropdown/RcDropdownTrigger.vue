<script setup lang="ts">
/**
 * A button that opens a menu. Used in conjunction with `RcDropdown.vue`.
 */
import { inject, onMounted, ref } from 'vue';
import { RcButton, RcButtonType } from '@rc/RcButton';
import { DropdownContext, defaultContext } from './types';

const {
  showMenu,
  registerTrigger,
  isMenuOpen,
  handleKeydown,
} = inject<DropdownContext>('dropdownContext') || defaultContext;

const dropdownTrigger = ref<RcButtonType | null>(null);

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
    @keydown.enter.space="handleKeydown"
    @click="showMenu(true)"
  >
    <template #before>
      <slot name="before">
        <!-- Empty Content -->
      </slot>
    </template>
    <slot name="default">
      <!--Empty slot content-->
    </slot>
    <template #after>
      <slot name="after">
        <!-- Empty Content -->
      </slot>
    </template>
  </RcButton>
</template>
